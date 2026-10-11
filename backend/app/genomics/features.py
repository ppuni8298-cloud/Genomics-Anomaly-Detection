import re
from typing import List, Dict, Any
from app.config import settings

DINUCLEOTIDES = [
    'AA', 'AC', 'AG', 'AT',
    'CA', 'CC', 'CG', 'CT',
    'GA', 'GC', 'GG', 'GT',
    'TA', 'TC', 'TG', 'TT'
]

def get_max_homopolymer_length(seq: str, base: str) -> int:
    """Finds length of the longest consecutive run of a specific base."""
    pattern = f"{base}+"
    matches = re.findall(pattern, seq)
    return max(len(m) for m in matches) if matches else 0

def extract_window_features(
    seq_id: str,
    sequence: str,
    window_size: int = 500,
    window_stride: int = 250,
    kmer_size: int = 7,
    min_window_length: int = 100,
    max_windows: int = 100_000
) -> List[Dict[str, Any]]:
    """
    Extracts multi-dimensional numeric feature vectors across sliding genomic windows.
    Enforces parameter bounds and resource limits.
    """
    if window_size < 50:
        raise ValueError(f"Window size ({window_size}) cannot be less than 50 base pairs.")
    if window_stride < 10:
        raise ValueError(f"Window stride ({window_stride}) cannot be less than 10 base pairs.")

    seq_len = len(sequence)
    if seq_len < min_window_length:
        window_size = max(seq_len, 1)
        window_stride = window_size

    feature_rows = []
    start = 0

    while start < seq_len:
        end = min(start + window_size, seq_len)
        win_seq = sequence[start:end]
        win_len = len(win_seq)

        # Skip windows that are too short to produce meaningful frequency distributions
        if win_len < min_window_length and len(feature_rows) > 0:
            break

        count_a = win_seq.count('A')
        count_t = win_seq.count('T')
        count_g = win_seq.count('G')
        count_c = win_seq.count('C')
        canonical_count = count_a + count_t + count_g + count_c
        ambiguous_count = win_len - canonical_count

        denom = max(canonical_count, 1)
        prop_a = count_a / denom
        prop_t = count_t / denom
        prop_g = count_g / denom
        prop_c = count_c / denom

        gc_content = (count_g + count_c) / denom
        at_content = (count_a + count_t) / denom

        # GC Skew = (G - C) / (G + C)
        gc_sum = count_g + count_c
        gc_skew = (count_g - count_c) / gc_sum if gc_sum > 0 else 0.0

        # Dinucleotide frequencies (16 dimensions)
        dinuc_counts = {dinuc: 0 for dinuc in DINUCLEOTIDES}
        total_dinucs = max(win_len - 1, 1)
        for i in range(win_len - 1):
            pair = win_seq[i:i+2]
            if pair in dinuc_counts:
                dinuc_counts[pair] += 1

        dinuc_props = {
            f"kmer_{k.lower()}": count / total_dinucs
            for k, count in dinuc_counts.items()
        }

        # Homopolymer maximum run lengths
        max_run_a = get_max_homopolymer_length(win_seq, 'A')
        max_run_t = get_max_homopolymer_length(win_seq, 'T')
        max_run_g = get_max_homopolymer_length(win_seq, 'G')
        max_run_c = get_max_homopolymer_length(win_seq, 'C')

        row = {
            "sequence_id": seq_id,
            "window_start": start,
            "window_end": end,
            "window_length": win_len,
            "prop_a": round(prop_a, 4),
            "prop_t": round(prop_t, 4),
            "prop_g": round(prop_g, 4),
            "prop_c": round(prop_c, 4),
            "gc_content": round(gc_content, 4),
            "at_content": round(at_content, 4),
            "gc_skew": round(gc_skew, 4),
            "max_run_a": max_run_a,
            "max_run_t": max_run_t,
            "max_run_g": max_run_g,
            "max_run_c": max_run_c,
            "ambiguous_count": ambiguous_count,
            **dinuc_props
        }

        feature_rows.append(row)

        if len(feature_rows) >= max_windows:
            break

        if end >= seq_len:
            break
        start += window_stride

    return feature_rows
