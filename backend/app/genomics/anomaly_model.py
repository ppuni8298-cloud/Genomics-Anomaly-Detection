import numpy as np
from typing import List, Dict, Any, Tuple
from sklearn.ensemble import IsolationForest

FEATURE_COLUMNS = [
    "prop_a", "prop_t", "prop_g", "prop_c",
    "gc_content", "at_content", "gc_skew",
    "max_run_a", "max_run_t", "max_run_g", "max_run_c",
    "kmer_aa", "kmer_ac", "kmer_ag", "kmer_at",
    "kmer_ca", "kmer_cc", "kmer_cg", "kmer_ct",
    "kmer_ga", "kmer_gc", "kmer_gg", "kmer_gt",
    "kmer_ta", "kmer_tc", "kmer_tg", "kmer_tt"
]

def safe_mean(items: List[Any], key: str) -> float:
    vals = [it.get(key, 0.0) if isinstance(it, dict) else 0.0 for it in items]
    return float(np.mean(vals)) if vals else 0.0

class GenomicAnomalyModel:
    """
    Trains an Isolation Forest outlier model on genomic feature matrices.
    """

    def __init__(self, contamination: float = 0.05, n_estimators: int = 100, random_state: int = 42):
        self.contamination = contamination
        self.n_estimators = n_estimators
        self.random_state = random_state
        self.model = IsolationForest(
            contamination=contamination,
            n_estimators=n_estimators,
            random_state=random_state,
            n_jobs=-1
        )

    def fit_predict_analysis(
        self,
        features: List[Dict[str, Any]],
        dataset_name: str
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], Dict[str, Any], Dict[str, int]]:
        """
        Executes Isolation Forest scoring across all windows, returning:
        1. List of flagged anomaly records
        2. Scored window profiles (for genomic window map & GC profile)
        3. Feature comparison matrix (normal vs anomalous windows)
        4. Severity count breakdown {high, medium, low, normal}
        """
        if not features:
            return [], [], {}, {"high": 0, "medium": 0, "low": 0, "normal": 0}

        # Convert feature dicts to 2D numpy matrix
        X = []
        for row in features:
            vec = [float(row.get(col, 0.0)) for col in FEATURE_COLUMNS]
            X.append(vec)
        X = np.array(X, dtype=np.float32)
        X = np.nan_to_num(X, nan=0.0, posinf=1.0, neginf=0.0)

        # Minimum rows needed to build an Isolation Forest
        if len(X) < 5:
            anomalies = self._heuristic_fallback(features, dataset_name)
            scored_windows = []
            for r in features:
                is_anom = any(a["position"].startswith(str(r["window_start"])) for a in anomalies)
                scored_windows.append({
                    "sequence_id": r["sequence_id"],
                    "window_start": r["window_start"],
                    "window_end": r["window_end"],
                    "position_label": f"{r['window_start']:,} - {r['window_end']:,} bp",
                    "score": 0.78 if is_anom else 0.15,
                    "is_anomaly": is_anom,
                    "severity": "medium" if is_anom else "normal",
                    "gc_content": r["gc_content"],
                    "at_content": r["at_content"],
                    "gc_skew": r["gc_skew"],
                    "max_homopolymer": max(r["max_run_a"], r["max_run_t"], r["max_run_g"], r["max_run_c"]),
                    "prop_a": r["prop_a"],
                    "prop_t": r["prop_t"],
                    "prop_g": r["prop_g"],
                    "prop_c": r["prop_c"],
                })
            severity_counts = {
                "high": 0,
                "medium": len(anomalies),
                "low": 0,
                "normal": len(features) - len(anomalies)
            }
            normal_feats = [w for w in scored_windows if not w["is_anomaly"]]
            anom_feats = [w for w in scored_windows if w["is_anomaly"]]
            gc_mean = safe_mean(features, "gc_content")
            feature_comparison = {
                "normal": {
                    "avgGcContent": round(safe_mean(normal_feats, "gc_content") * 100, 1),
                    "avgAtContent": round(safe_mean(normal_feats, "at_content") * 100, 1),
                    "avgGcSkew": round(safe_mean(normal_feats, "gc_skew"), 3),
                    "avgMaxHomopolymer": round(safe_mean([{"v": r["max_homopolymer"]} for r in normal_feats], "v"), 1)
                },
                "anomalous": {
                    "avgGcContent": round(safe_mean(anom_feats, "gc_content") * 100, 1) if anom_feats else round(gc_mean * 100, 1),
                    "avgAtContent": round(safe_mean(anom_feats, "at_content") * 100, 1) if anom_feats else round((1 - gc_mean) * 100, 1),
                    "avgGcSkew": round(safe_mean(anom_feats, "gc_skew"), 3) if anom_feats else 0.0,
                    "avgMaxHomopolymer": round(safe_mean([{"v": r["max_homopolymer"]} for r in anom_feats], "v"), 1) if anom_feats else 0.0
                }
            }
            return anomalies, scored_windows, feature_comparison, severity_counts

        self.model.fit(X)

        decision_scores = self.model.decision_function(X)
        predictions = self.model.predict(X)  # -1 for anomaly, 1 for inlier

        min_s = float(np.min(decision_scores))
        max_s = float(np.max(decision_scores))
        score_range = max(max_s - min_s, 1e-6)

        normalized_scores = 1.0 - ((decision_scores - min_s) / score_range)
        gc_mean = float(np.mean([r["gc_content"] for r in features]))

        anomalies = []
        scored_windows = []
        severity_counts = {"high": 0, "medium": 0, "low": 0, "normal": 0}

        normal_feats = []
        anom_feats = []

        for idx, (pred, norm_score) in enumerate(zip(predictions, normalized_scores)):
            row = features[idx]
            score_val = round(float(norm_score), 3)
            is_flagged = (pred == -1 or norm_score >= 0.70)
            max_homopoly = max(row["max_run_a"], row["max_run_t"], row["max_run_g"], row["max_run_c"])

            if is_flagged:
                if score_val >= 0.80:
                    severity = "high"
                    severity_counts["high"] += 1
                elif score_val >= 0.65:
                    severity = "medium"
                    severity_counts["medium"] += 1
                else:
                    severity = "low"
                    severity_counts["low"] += 1

                gc_diff = row["gc_content"] - gc_mean
                gc_diff_pct = round(gc_diff * 100, 1)

                if abs(gc_diff) > 0.15:
                    anomaly_type = "Extreme GC-Skew Outlier"
                    gc_dev = f"{'+' if gc_diff > 0 else ''}{gc_diff_pct}% vs mean"
                    description = f"Window shows significant atypical GC composition ({round(row['gc_content']*100, 1)}%), suggesting horizontal transfer or regional variation."
                elif max_homopoly >= 8:
                    anomaly_type = "Homopolymer Run Anomaly"
                    gc_dev = f"{'+' if gc_diff > 0 else ''}{gc_diff_pct}% vs mean"
                    description = f"Extended homopolymer repeat of {max_homopoly} bases identified."
                else:
                    anomaly_type = "K-mer Frequency Deviation"
                    gc_dev = f"{'+' if gc_diff > 0 else ''}{gc_diff_pct}% vs mean"
                    description = "Dinucleotide distribution deviates substantially from baseline genomic background."

                pos_str = f"{row['window_start']:,} - {row['window_end']:,} bp"

                anomalies.append({
                    "sequence_id": f"{row['sequence_id']}_LOC_{row['window_start']}",
                    "anomaly_type": anomaly_type,
                    "score": score_val,
                    "severity": severity,
                    "dataset_name": dataset_name,
                    "position": pos_str,
                    "gc_deviation": gc_dev,
                    "description": description
                })
                anom_feats.append(row)
            else:
                severity = "normal"
                severity_counts["normal"] += 1
                normal_feats.append(row)

            scored_windows.append({
                "sequence_id": row["sequence_id"],
                "window_start": row["window_start"],
                "window_end": row["window_end"],
                "position_label": f"{row['window_start']:,} - {row['window_end']:,} bp",
                "score": score_val,
                "is_anomaly": is_flagged,
                "severity": severity,
                "gc_content": row["gc_content"],
                "at_content": row["at_content"],
                "gc_skew": row["gc_skew"],
                "max_homopolymer": max_homopoly,
                "prop_a": row["prop_a"],
                "prop_t": row["prop_t"],
                "prop_g": row["prop_g"],
                "prop_c": row["prop_c"],
            })

        anomalies.sort(key=lambda a: a["score"], reverse=True)


        feature_comparison = {
            "normal": {
                "avgGcContent": round(safe_mean(normal_feats, "gc_content") * 100, 1),
                "avgAtContent": round(safe_mean(normal_feats, "at_content") * 100, 1),
                "avgGcSkew": round(safe_mean(normal_feats, "gc_skew"), 3),
                "avgMaxHomopolymer": round(safe_mean([{"v": max(r["max_run_a"], r["max_run_t"], r["max_run_g"], r["max_run_c"])} for r in normal_feats], "v"), 1)
            },
            "anomalous": {
                "avgGcContent": round(safe_mean(anom_feats, "gc_content") * 100, 1) if anom_feats else round(gc_mean * 100, 1),
                "avgAtContent": round(safe_mean(anom_feats, "at_content") * 100, 1) if anom_feats else round((1 - gc_mean) * 100, 1),
                "avgGcSkew": round(safe_mean(anom_feats, "gc_skew"), 3) if anom_feats else 0.0,
                "avgMaxHomopolymer": round(safe_mean([{"v": max(r["max_run_a"], r["max_run_t"], r["max_run_g"], r["max_run_c"])} for r in anom_feats], "v"), 1) if anom_feats else 0.0
            }
        }

        return anomalies, scored_windows, feature_comparison, severity_counts

    def fit_predict_anomalies(
        self,
        features: List[Dict[str, Any]],
        dataset_name: str
    ) -> List[Dict[str, Any]]:
        anomalies, _, _, _ = self.fit_predict_analysis(features, dataset_name)
        return anomalies

    def _heuristic_fallback(self, features: List[Dict[str, Any]], dataset_name: str) -> List[Dict[str, Any]]:
        anomalies = []
        gc_vals = [r["gc_content"] for r in features]
        gc_mean = float(np.mean(gc_vals)) if gc_vals else 0.5

        for row in features:
            gc_diff = abs(row["gc_content"] - gc_mean)
            if gc_diff > 0.20:
                anomalies.append({
                    "sequence_id": f"{row['sequence_id']}_LOC_{row['window_start']}",
                    "anomaly_type": "GC-Skew Outlier",
                    "score": 0.78,
                    "severity": "medium",
                    "dataset_name": dataset_name,
                    "position": f"{row['window_start']} - {row['window_end']} bp",
                    "gc_deviation": f"{round(gc_diff*100, 1)}% dev",
                    "description": "Sequence window exhibits extreme deviation from baseline mean."
                })
        return anomalies
