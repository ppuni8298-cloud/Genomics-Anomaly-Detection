import pytest
from app.genomics.features import extract_window_features, get_max_homopolymer_length

def test_max_homopolymer_length():
    seq = "ACGGGGGTAAAATTTTTT"
    assert get_max_homopolymer_length(seq, 'G') == 5
    assert get_max_homopolymer_length(seq, 'A') == 4
    assert get_max_homopolymer_length(seq, 'T') == 6
    assert get_max_homopolymer_length(seq, 'C') == 1

def test_extract_window_features():
    # 600 bp synthetic sequence with known GC shift
    seq = ("AT" * 150) + ("GC" * 150)
    features = extract_window_features(
        seq_id="TEST_SEQ",
        sequence=seq,
        window_size=200,
        window_stride=200,
        min_window_length=50
    )

    assert len(features) == 3
    # First window is pure AT
    assert features[0]["at_content"] == 1.0
    assert features[0]["gc_content"] == 0.0

    # Last window is pure GC
    assert features[2]["gc_content"] == 1.0
    assert features[2]["at_content"] == 0.0

    # Check that all 16 dinucleotide keys exist
    for d in ['aa', 'ac', 'ag', 'at', 'ca', 'cc', 'cg', 'ct', 'ga', 'gc', 'gg', 'gt', 'ta', 'tc', 'tg', 'tt']:
        assert f"kmer_{d}" in features[0]
