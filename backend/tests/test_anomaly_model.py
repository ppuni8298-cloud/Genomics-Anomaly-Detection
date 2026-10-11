import pytest
from app.genomics.anomaly_model import GenomicAnomalyModel
from app.genomics.features import extract_window_features

def test_anomaly_model_training_and_scoring():
    # Construct 20 background windows of normal balanced sequence (50% GC)
    normal_seq = ("ATCG" * 125) # 500bp
    features = []
    for i in range(25):
        feats = extract_window_features(f"SEQ_{i}", normal_seq, window_size=500, window_stride=500)
        features.extend(feats)

    # Insert 1 anomalous window with extreme GC bias (poly-G/C)
    extreme_seq = ("GGCC" * 125)
    anom_feats = extract_window_features("ANOMALOUS_SEQ", extreme_seq, window_size=500, window_stride=500)
    features.extend(anom_feats)

    model = GenomicAnomalyModel(contamination=0.05, random_state=42)
    anomalies = model.fit_predict_anomalies(features, "test_dataset.fasta")

    assert isinstance(anomalies, list)
    if len(anomalies) > 0:
        top_anom = anomalies[0]
        assert "score" in top_anom
        assert 0.0 <= top_anom["score"] <= 1.0
        assert top_anom["severity"] in {"low", "medium", "high"}
        assert "Extreme GC-Skew" in top_anom["anomaly_type"] or "K-mer" in top_anom["anomaly_type"]
