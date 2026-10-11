import time
import logging
from typing import List, Dict, Any, Tuple
from app.config import settings
from app.genomics.anomaly_model import GenomicAnomalyModel

logger = logging.getLogger("genomeai.spark")

class SparkGenomicsEngine:
    """
    Manages Apache Spark session and distributed DataFrame operations
    for genomic sliding-window feature analysis.
    """

    def __init__(self):
        self._spark = None

    def get_spark_session(self):
        if self._spark is None:
            try:
                from pyspark.sql import SparkSession
                self._spark = (
                    SparkSession.builder
                    .appName(settings.SPARK_APP_NAME)
                    .master(settings.SPARK_MASTER)
                    .config("spark.driver.memory", settings.SPARK_DRIVER_MEMORY)
                    .config("spark.sql.execution.arrow.pyspark.enabled", "true")
                    .config("spark.ui.enabled", "false")
                    .getOrCreate()
                )
                logger.info("Apache Spark session initialized successfully.")
            except Exception as e:
                logger.warning(f"Could not initialize PySpark session directly: {e}. Falling back to vectorized engine.")
                self._spark = None
        return self._spark

    def process_features_and_detect_anomalies(
        self,
        features: List[Dict[str, Any]],
        dataset_name: str,
        contamination: float = 0.05,
        random_seed: int = 42
    ) -> Tuple[List[Dict[str, Any]], float, str, List[Dict[str, Any]], Dict[str, Any], Dict[str, int]]:
        start_time = time.time()
        spark = self.get_spark_session()

        global_gc = 0.5
        if features:
            global_gc = float(sum(r["gc_content"] for r in features) / len(features))

        if spark is not None and len(features) > 0:
            try:
                import pyspark.sql.functions as F
                # 1. Create PySpark DataFrame
                df = spark.createDataFrame(features)

                # 2. PySpark distributed transformations: compute aggregates
                stats_df = df.agg(
                    F.mean("gc_content").alias("avg_gc"),
                    F.stddev("gc_content").alias("std_gc"),
                    F.min("gc_content").alias("min_gc"),
                    F.max("gc_content").alias("max_gc"),
                    F.count("sequence_id").alias("total_windows")
                )

                stats_row = stats_df.first()
                if stats_row and stats_row["avg_gc"] is not None:
                    global_gc = float(stats_row["avg_gc"])

                logger.info(f"PySpark transformation completed for {len(features)} genomic windows.")
            except Exception as e:
                logger.warning(f"PySpark execution warning: {e}. Continuing with ML isolation pipeline.")

        # 3. Isolation Forest Outlier Scoring with Feature Comparison
        model = GenomicAnomalyModel(contamination=contamination, random_state=random_seed)
        anomalies, scored_windows, feature_comparison, severity_counts = model.fit_predict_analysis(features, dataset_name)

        elapsed = time.time() - start_time
        if elapsed < 60:
            duration_str = f"{elapsed:.1f}s"
        else:
            mins = int(elapsed // 60)
            secs = int(elapsed % 60)
            duration_str = f"{mins}m {secs}s"

        return anomalies, round(global_gc * 100, 1), duration_str, scored_windows, feature_comparison, severity_counts

spark_engine = SparkGenomicsEngine()
