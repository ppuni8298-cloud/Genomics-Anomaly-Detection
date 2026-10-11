import pytest
from app.genomics.parser import GenomicParser, GenomicParseError

SAMPLE_FASTA = """
>NC_000913.3 Escherichia coli str. K-12 substr. MG1655
AGCTTTTCATTCTGACTGCAACGGGCAATATGTCTCTGTGTGGATTAAAAAAAGAGTGTCTGATAGCAGC
TTCTGAACTGGTTACCTGCCGTGAGTAAATTAAAATTTTATTGACTTAGGTCACTAAATACTTTAACCAA
TATAGGCATAGCGCACAGACAGATAAAAATTACAGAGTACACAACATCCATGAAACGCATTAGCACCACC
"""

SAMPLE_CSV = """sequence_id,sequence
CHR_1,AGCTTTTCATTCTGACTGCAACGGGCAATATGTCTCTGTGTGGATTAAAAAAAGAGTGTCTGATAGCAGCTTCTGAACTGGTTACCTGCCGTGAGTAAATTAAAATTTTATTGACTTAGGTCACTAAATACTTTAACCAA
CHR_2,TATAGGCATAGCGCACAGACAGATAAAAATTACAGAGTACACAACATCCATGAAACGCATTAGCACCACCATTACCACCACCATCACCATTACCACAGGTAACGGTGCGGGCTGACGCGTACAGGAAACACAGAAAAAAGC
"""

def test_detect_format_fasta():
    fmt = GenomicParser.detect_format("test.fasta", b">SEQ1\nACGT")
    assert fmt == "fasta"

def test_detect_format_csv():
    fmt = GenomicParser.detect_format("data.csv", b"sequence_id,sequence\nS1,ACGT")
    assert fmt == "csv"

def test_detect_format_empty():
    with pytest.raises(GenomicParseError):
        GenomicParser.detect_format("empty.fa", b"")

def test_parse_fasta_success():
    records = GenomicParser.parse_fasta(SAMPLE_FASTA)
    assert len(records) == 1
    assert records[0]["sequence_id"] == "NC_000913.3"
    assert "Escherichia coli" in records[0]["description"]
    assert len(records[0]["sequence"]) == 210
    assert records[0]["sequence"].isupper()

def test_parse_fasta_lowercase_and_whitespace():
    raw = ">seq1 test\n  acgt\n  tgca  \n"
    records = GenomicParser.parse_fasta(raw)
    assert records[0]["sequence"] == "ACGTTGCA"

def test_parse_fasta_ambiguous_bases():
    raw = ">seq_ambig\nACGTNNNNACGT"
    records = GenomicParser.parse_fasta(raw)
    assert "N" in records[0]["sequence"]

def test_parse_fasta_empty_error():
    with pytest.raises(GenomicParseError):
        GenomicParser.parse_fasta(">seq_empty\n")

def test_parse_csv_success():
    records = GenomicParser.parse_csv(SAMPLE_CSV)
    assert len(records) == 2
    assert records[0]["sequence_id"] == "CHR_1"
    assert records[1]["sequence_id"] == "CHR_2"

def test_calculate_nucleotide_composition():
    records = [{"sequence_id": "test", "sequence": "AAACCCGGGTTT"}]
    comp = GenomicParser.calculate_nucleotide_composition(records)
    assert comp["adenine"] == 25.0
    assert comp["cytosine"] == 25.0
    assert comp["guanine"] == 25.0
    assert comp["thymine"] == 25.0
    assert comp["gcContent"] == 50.0
    assert comp["totalBases"] == 12
