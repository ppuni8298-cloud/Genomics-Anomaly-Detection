import csv
import io
import re
from typing import List, Dict, Any, Tuple
from app.config import settings

VALID_BASES = {'A', 'C', 'G', 'T'}
IUPAC_AMBIGUOUS = {'N', 'R', 'Y', 'S', 'W', 'K', 'M', 'B', 'D', 'H', 'V'}
ALL_VALID_GENOMIC = VALID_BASES | IUPAC_AMBIGUOUS

class GenomicParseError(ValueError):
    """Raised when genomic sequence file fails validation or format checks."""
    pass

class GenomicParser:
    """
    Parses FASTA and CSV genomic files into normalized sequence records.

    Supported:
    - FASTA (.fasta, .fa, .fna): Standard multi-FASTA with headers >seq_id
    - CSV (.csv): Required columns: sequence_id (or id/name) and sequence (or seq/dna)
    """

    @staticmethod
    def detect_format(filename: str, sample_bytes: bytes) -> str:
        """Inspects filename extension and initial byte signatures."""
        sample_text = sample_bytes[:2048].decode('utf-8', errors='ignore').strip()
        if not sample_text:
            raise GenomicParseError("Uploaded file is empty.")

        ext = '.' + filename.split('.')[-1].lower() if '.' in filename else ''

        if sample_text.startswith('>') or ext in {'.fasta', '.fa', '.fna'}:
            return 'fasta'

        if ',' in sample_text or ext == '.csv':
            return 'csv'

        raise GenomicParseError(f"Unsupported genomic file format for '{filename}'. Expected FASTA or CSV.")

    @classmethod
    def parse_fasta(cls, content_str: str) -> List[Dict[str, str]]:
        records = []
        current_id = None
        current_desc = ""
        current_seq_parts = []

        lines = content_str.splitlines()
        if not lines:
            raise GenomicParseError("FASTA file contains no lines.")

        for line_num, line in enumerate(lines, 1):
            line = line.strip()
            if not line:
                continue

            if line.startswith('>'):
                # Save previous record if exists
                if current_id:
                    seq = "".join(current_seq_parts).upper()
                    cleaned_seq, valid_count = cls._clean_and_validate_seq(seq, current_id)
                    records.append({
                        "sequence_id": current_id,
                        "description": current_desc,
                        "sequence": cleaned_seq
                    })
                    current_seq_parts = []

                if len(records) >= settings.MAX_RECORD_COUNT:
                    raise GenomicParseError(f"File exceeds maximum allowed record count of {settings.MAX_RECORD_COUNT:,} sequences.")

                # Parse new header
                header_line = line[1:].strip()
                if not header_line:
                    raise GenomicParseError(f"Line {line_num}: Empty FASTA header '>' with no sequence identifier.")

                parts = header_line.split(maxsplit=1)
                current_id = parts[0]
                current_desc = parts[1] if len(parts) > 1 else ""
            else:
                if not current_id:
                    raise GenomicParseError(f"Line {line_num}: Sequence characters found before first FASTA header line.")
                current_seq_parts.append(line)

        # Append last record
        if current_id:
            seq = "".join(current_seq_parts).upper()
            cleaned_seq, valid_count = cls._clean_and_validate_seq(seq, current_id)
            records.append({
                "sequence_id": current_id,
                "description": current_desc,
                "sequence": cleaned_seq
            })

        if not records:
            raise GenomicParseError("No valid sequence records found in FASTA content.")

        return records

    @classmethod
    def parse_csv(cls, content_str: str) -> List[Dict[str, str]]:
        records = []
        f = io.StringIO(content_str)
        reader = csv.reader(f)

        try:
            header = next(reader)
        except StopIteration:
            raise GenomicParseError("CSV file is empty.")

        header_lower = [h.strip().lower() for h in header]

        # Locate sequence_id and sequence columns
        id_col_idx = -1
        seq_col_idx = -1

        for idx, col in enumerate(header_lower):
            if col in {'sequence_id', 'seq_id', 'id', 'name', 'identifier'}:
                id_col_idx = idx
            elif col in {'sequence', 'seq', 'dna', 'bases', 'nucleotides'}:
                seq_col_idx = idx

        if seq_col_idx == -1:
            raise GenomicParseError(
                "CSV must contain a 'sequence' column (or 'seq', 'dna', 'bases'). "
                f"Found columns: {', '.join(header)}"
            )

        if id_col_idx == -1:
            id_col_idx = None

        row_num = 1
        for row in reader:
            row_num += 1
            if not row or all(c.strip() == '' for c in row):
                continue

            if len(records) >= settings.MAX_RECORD_COUNT:
                raise GenomicParseError(f"CSV exceeds maximum allowed record count of {settings.MAX_RECORD_COUNT:,} rows.")

            seq_raw = row[seq_col_idx].strip() if seq_col_idx < len(row) else ''
            if not seq_raw:
                continue

            seq_id = row[id_col_idx].strip() if id_col_idx is not None and id_col_idx < len(row) else f"SEQ_{row_num-1}"
            if not seq_id:
                seq_id = f"SEQ_{row_num-1}"

            cleaned_seq, valid_count = cls._clean_and_validate_seq(seq_raw.upper(), seq_id)
            records.append({
                "sequence_id": seq_id,
                "description": f"Imported from CSV row {row_num}",
                "sequence": cleaned_seq
            })

        if not records:
            raise GenomicParseError("No valid sequence rows found in CSV.")

        return records

    @staticmethod
    def _clean_and_validate_seq(raw_seq: str, seq_id: str) -> Tuple[str, int]:
        """Cleans sequence, removes whitespace, checks usable nucleotide bases."""
        cleaned = re.sub(r'\s+', '', raw_seq).upper()
        if not cleaned:
            raise GenomicParseError(f"Sequence for '{seq_id}' contains no bases.")

        if len(cleaned) > settings.MAX_SEQUENCE_LENGTH:
            raise GenomicParseError(
                f"Sequence for '{seq_id}' length ({len(cleaned):,} bases) exceeds maximum allowable limit of {settings.MAX_SEQUENCE_LENGTH:,} bases."
            )

        # Check for invalid characters (numbers, special chars, etc.)
        invalid_chars = set(cleaned) - ALL_VALID_GENOMIC
        if len(invalid_chars) > 0 and len(invalid_chars) / len(cleaned) > 0.05:
            sample_invalid = list(invalid_chars)[:3]
            raise GenomicParseError(
                f"Sequence for '{seq_id}' contains invalid non-nucleotide characters: {sample_invalid}. "
                "Only standard (A, C, G, T) and IUPAC ambiguous bases (N, etc.) are permitted."
            )

        # Standard canonical bases count
        canonical_count = sum(1 for b in cleaned if b in VALID_BASES)
        if canonical_count == 0:
            raise GenomicParseError(f"Sequence for '{seq_id}' contains 0 canonical A, C, G, T bases.")

        return cleaned, canonical_count

    @classmethod
    def calculate_nucleotide_composition(cls, records: List[Dict[str, str]]) -> Dict[str, float]:
        """Calculates global base composition across all parsed sequences."""
        total_a = 0
        total_t = 0
        total_g = 0
        total_c = 0
        total_n = 0

        for r in records:
            seq = r["sequence"]
            total_a += seq.count('A')
            total_t += seq.count('T')
            total_g += seq.count('G')
            total_c += seq.count('C')
            total_n += sum(seq.count(b) for b in IUPAC_AMBIGUOUS)

        total_bases = total_a + total_t + total_g + total_c + total_n
        if total_bases == 0:
            return {
                "adenine": 0.0,
                "thymine": 0.0,
                "guanine": 0.0,
                "cytosine": 0.0,
                "gcContent": 0.0,
                "totalBases": 0
            }

        # Canonical bases sum for percentage proportions
        canonical_sum = total_a + total_t + total_g + total_c
        if canonical_sum == 0:
            return {
                "adenine": 0.0,
                "thymine": 0.0,
                "guanine": 0.0,
                "cytosine": 0.0,
                "gcContent": 0.0,
                "totalBases": total_bases
            }

        a_pct = round((total_a / canonical_sum) * 100, 1)
        t_pct = round((total_t / canonical_sum) * 100, 1)
        g_pct = round((total_g / canonical_sum) * 100, 1)
        c_pct = round((total_c / canonical_sum) * 100, 1)
        gc_pct = round(((total_g + total_c) / canonical_sum) * 100, 1)

        return {
            "adenine": a_pct,
            "thymine": t_pct,
            "guanine": g_pct,
            "cytosine": c_pct,
            "gcContent": gc_pct,
            "totalBases": total_bases
        }
