import openpyxl
from openpyxl.utils import get_column_letter
import json
import re
from collections import defaultdict

def analyze_excel_file(file_path):
    """
    Comprehensive analysis of an Excel file including:
    - Sheet names and structure
    - All formulas and calculations
    - Input and output fields
    - Business logic and rules
    """

    print(f"\n{'='*80}")
    print(f"ANALYZING: {file_path}")
    print(f"{'='*80}\n")

    try:
        wb = openpyxl.load_workbook(file_path, data_only=False)

        analysis = {
            'filename': file_path,
            'total_sheets': len(wb.sheetnames),
            'sheet_names': wb.sheetnames,
            'sheets': {}
        }

        for sheet_name in wb.sheetnames:
            print(f"\n{'*'*80}")
            print(f"SHEET: {sheet_name}")
            print(f"{'*'*80}\n")

            ws = wb[sheet_name]
            sheet_analysis = analyze_sheet(ws, sheet_name)
            analysis['sheets'][sheet_name] = sheet_analysis

            # Print summary
            print(f"\nSummary for '{sheet_name}':")
            print(f"  - Dimensions: {ws.dimensions}")
            print(f"  - Total formulas: {len(sheet_analysis['formulas'])}")
            print(f"  - Named ranges in sheet: {len(sheet_analysis['named_ranges'])}")
            print(f"  - Tables detected: {len(sheet_analysis['tables'])}")
            print(f"  - Input fields detected: {len(sheet_analysis['input_fields'])}")
            print(f"  - Output fields detected: {len(sheet_analysis['output_fields'])}")

        # Analyze workbook-level named ranges
        print(f"\n{'='*80}")
        print("WORKBOOK-LEVEL NAMED RANGES")
        print(f"{'='*80}\n")

        workbook_named_ranges = {}
        for name in wb.defined_names.definedName:
            print(f"Name: {name.name}")
            print(f"  Reference: {name.attr_text}")
            workbook_named_ranges[name.name] = name.attr_text

        analysis['workbook_named_ranges'] = workbook_named_ranges

        return analysis

    except Exception as e:
        print(f"ERROR analyzing {file_path}: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

def analyze_sheet(ws, sheet_name):
    """Analyze a single worksheet in detail"""

    sheet_data = {
        'name': sheet_name,
        'dimensions': str(ws.dimensions),
        'max_row': ws.max_row,
        'max_col': ws.max_column,
        'columns': [],
        'formulas': [],
        'input_fields': [],
        'output_fields': [],
        'tables': [],
        'named_ranges': [],
        'conditional_formatting': [],
        'data_validation': [],
        'merged_cells': [],
        'structure': defaultdict(dict)
    }

    # Get merged cells
    for merged_range in ws.merged_cells.ranges:
        sheet_data['merged_cells'].append(str(merged_range))

    # Scan all cells
    print("Scanning cells...")
    for row_idx, row in enumerate(ws.iter_rows(), start=1):
        for col_idx, cell in enumerate(row, start=1):
            cell_ref = f"{get_column_letter(col_idx)}{row_idx}"

            if cell.value is not None:
                cell_info = {
                    'address': cell_ref,
                    'value': str(cell.value)[:100],  # Truncate long values
                    'data_type': str(cell.data_type),
                    'number_format': cell.number_format
                }

                # Check if it's a formula
                if cell.data_type == 'f':
                    formula_info = {
                        'cell': cell_ref,
                        'formula': cell.value,
                        'number_format': cell.number_format,
                        'row': row_idx,
                        'col': col_idx
                    }
                    sheet_data['formulas'].append(formula_info)

                    # Classify as output field
                    sheet_data['output_fields'].append({
                        'cell': cell_ref,
                        'formula': cell.value,
                        'type': 'calculated'
                    })

                    # Print formula details
                    if len(sheet_data['formulas']) <= 50:  # Limit output
                        print(f"  Formula at {cell_ref}: {cell.value}")

                # Check for potential input fields (no formula, in specific patterns)
                elif cell.data_type in ('n', 's') and not is_likely_label(cell.value):
                    # Look for patterns that suggest input fields
                    if is_likely_input_field(ws, cell, row_idx, col_idx):
                        sheet_data['input_fields'].append({
                            'cell': cell_ref,
                            'value': cell.value,
                            'data_type': cell.data_type,
                            'context': get_cell_context(ws, row_idx, col_idx)
                        })

                # Store in structure
                sheet_data['structure'][row_idx][col_idx] = cell_info

                # Data validation
                if cell.data_validation.type:
                    sheet_data['data_validation'].append({
                        'cell': cell_ref,
                        'type': cell.data_validation.type,
                        'formula1': cell.data_validation.formula1,
                        'formula2': cell.data_validation.formula2
                    })

    # Detect table structures
    print("Detecting table structures...")
    sheet_data['tables'] = detect_tables(ws)

    # Analyze formula patterns
    print("Analyzing formula patterns...")
    sheet_data['formula_patterns'] = analyze_formula_patterns(sheet_data['formulas'])

    # Detect calculators/sections
    print("Detecting calculators and sections...")
    sheet_data['calculators'] = detect_calculators(ws, sheet_data)

    return sheet_data

def is_likely_label(value):
    """Check if a cell value is likely a label/header"""
    if not isinstance(value, str):
        return False

    # Common label patterns
    label_patterns = [
        r'^[A-Z][a-z]+.*:$',  # Capitalized word ending with colon
        r'^[A-Z\s]+$',  # All caps
        r'^\s*$',  # Empty or whitespace
    ]

    value_str = str(value).strip()
    if len(value_str) < 2:
        return True

    for pattern in label_patterns:
        if re.match(pattern, value_str):
            return True

    return False

def is_likely_input_field(ws, cell, row_idx, col_idx):
    """Determine if a cell is likely an input field based on context"""

    # Check adjacent cells for labels
    left_cell = ws.cell(row_idx, max(1, col_idx - 1))
    top_cell = ws.cell(max(1, row_idx - 1), col_idx)

    # If left or top cell contains text (label), this might be input
    if left_cell.value and isinstance(left_cell.value, str) and not left_cell.data_type == 'f':
        return True

    if top_cell.value and isinstance(top_cell.value, str) and not top_cell.data_type == 'f':
        return True

    # Check if cell has special formatting (like background color for input)
    if cell.fill and cell.fill.start_color:
        color = cell.fill.start_color.rgb
        if color and color != '00000000':  # Not default
            return True

    return False

def get_cell_context(ws, row_idx, col_idx):
    """Get context around a cell (labels, headers)"""
    context = {}

    # Get left label
    left_cell = ws.cell(row_idx, max(1, col_idx - 1))
    if left_cell.value:
        context['left_label'] = str(left_cell.value)

    # Get top header
    top_cell = ws.cell(max(1, row_idx - 1), col_idx)
    if top_cell.value:
        context['top_label'] = str(top_cell.value)

    # Get top-left diagonal
    top_left_cell = ws.cell(max(1, row_idx - 1), max(1, col_idx - 1))
    if top_left_cell.value:
        context['top_left_label'] = str(top_left_cell.value)

    return context

def detect_tables(ws):
    """Detect table-like structures in the worksheet"""
    tables = []

    # Look for header rows followed by data
    potential_headers = []

    for row_idx in range(1, min(ws.max_row, 100)):  # Check first 100 rows
        row_cells = list(ws.iter_rows(min_row=row_idx, max_row=row_idx, values_only=False))
        if not row_cells:
            continue

        row_values = [cell.value for cell in row_cells[0] if cell.value is not None]

        # Check if row looks like headers (mostly text, consecutive non-empty cells)
        if len(row_values) >= 3:
            text_count = sum(1 for v in row_values if isinstance(v, str))
            if text_count / len(row_values) > 0.7:
                potential_headers.append({
                    'row': row_idx,
                    'headers': row_values
                })

    for header in potential_headers[:5]:  # Limit to first 5 potential tables
        tables.append({
            'header_row': header['row'],
            'headers': header['headers'],
            'estimated_columns': len(header['headers'])
        })

    return tables

def analyze_formula_patterns(formulas):
    """Analyze patterns in formulas to understand business logic"""
    patterns = {
        'sum_operations': [],
        'if_conditions': [],
        'vlookup_operations': [],
        'multiplication': [],
        'division': [],
        'percentage': [],
        'other': []
    }

    for formula_info in formulas:
        formula = formula_info['formula'].upper()

        if 'SUM(' in formula:
            patterns['sum_operations'].append(formula_info)
        elif 'IF(' in formula:
            patterns['if_conditions'].append(formula_info)
        elif 'VLOOKUP(' in formula or 'HLOOKUP(' in formula or 'XLOOKUP(' in formula:
            patterns['vlookup_operations'].append(formula_info)
        elif '*' in formula and '/' not in formula:
            patterns['multiplication'].append(formula_info)
        elif '/' in formula:
            patterns['division'].append(formula_info)
        elif '%' in formula or '0.0%' in str(formula_info.get('number_format', '')):
            patterns['percentage'].append(formula_info)
        else:
            patterns['other'].append(formula_info)

    return {
        'sum_count': len(patterns['sum_operations']),
        'if_count': len(patterns['if_conditions']),
        'lookup_count': len(patterns['vlookup_operations']),
        'multiplication_count': len(patterns['multiplication']),
        'division_count': len(patterns['division']),
        'percentage_count': len(patterns['percentage']),
        'examples': {
            'sum': patterns['sum_operations'][:3],
            'if': patterns['if_conditions'][:3],
            'lookup': patterns['vlookup_operations'][:3],
            'multiplication': patterns['multiplication'][:3],
            'division': patterns['division'][:3]
        }
    }

def detect_calculators(ws, sheet_data):
    """Detect calculator sections based on formulas and structure"""
    calculators = []

    # Group formulas by proximity
    formula_groups = defaultdict(list)

    for formula_info in sheet_data['formulas']:
        row = formula_info['row']
        # Group by approximate row ranges (every 10 rows)
        group_key = (row // 10) * 10
        formula_groups[group_key].append(formula_info)

    # Identify significant groups
    for group_key, formulas in formula_groups.items():
        if len(formulas) >= 3:  # At least 3 formulas suggest a calculator
            calculators.append({
                'row_range': f"{group_key}-{group_key + 10}",
                'formula_count': len(formulas),
                'formulas': formulas[:10]  # Sample
            })

    return calculators

def save_analysis_to_file(analysis, output_file):
    """Save analysis to JSON file"""
    # Convert to JSON-serializable format
    json_data = json.dumps(analysis, indent=2, default=str)

    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(json_data)

    print(f"\nAnalysis saved to: {output_file}")

def compare_files(analysis1, analysis2):
    """Compare two Excel file analyses"""

    print(f"\n{'='*80}")
    print("COMPARISON ANALYSIS")
    print(f"{'='*80}\n")

    comparison = {
        'file1': analysis1['filename'],
        'file2': analysis2['filename'],
        'common_sheets': [],
        'unique_to_file1': [],
        'unique_to_file2': [],
        'sheet_comparison': {}
    }

    sheets1 = set(analysis1['sheet_names'])
    sheets2 = set(analysis2['sheet_names'])

    comparison['common_sheets'] = list(sheets1 & sheets2)
    comparison['unique_to_file1'] = list(sheets1 - sheets2)
    comparison['unique_to_file2'] = list(sheets2 - sheets1)

    print(f"File 1: {analysis1['filename']}")
    print(f"  Total sheets: {analysis1['total_sheets']}")
    print(f"  Sheets: {', '.join(analysis1['sheet_names'])}\n")

    print(f"File 2: {analysis2['filename']}")
    print(f"  Total sheets: {analysis2['total_sheets']}")
    print(f"  Sheets: {', '.join(analysis2['sheet_names'])}\n")

    print(f"Common sheets: {', '.join(comparison['common_sheets']) if comparison['common_sheets'] else 'None'}")
    print(f"Unique to File 1: {', '.join(comparison['unique_to_file1']) if comparison['unique_to_file1'] else 'None'}")
    print(f"Unique to File 2: {', '.join(comparison['unique_to_file2']) if comparison['unique_to_file2'] else 'None'}")

    # Compare common sheets
    for sheet_name in comparison['common_sheets']:
        sheet1 = analysis1['sheets'][sheet_name]
        sheet2 = analysis2['sheets'][sheet_name]

        comparison['sheet_comparison'][sheet_name] = {
            'file1_formulas': len(sheet1['formulas']),
            'file2_formulas': len(sheet2['formulas']),
            'file1_inputs': len(sheet1['input_fields']),
            'file2_inputs': len(sheet2['input_fields']),
            'file1_outputs': len(sheet1['output_fields']),
            'file2_outputs': len(sheet2['output_fields'])
        }

    return comparison

# Main execution
if __name__ == "__main__":
    vac_file = "D:/manu/documents/vac.xlsx"
    mva_file = "D:/manu/documents/mva-master.xlsx"

    print("Starting Excel Analysis...")
    print("This may take a few minutes for large files...\n")

    # Analyze both files
    vac_analysis = analyze_excel_file(vac_file)
    mva_analysis = analyze_excel_file(mva_file)

    # Save individual analyses
    if vac_analysis:
        save_analysis_to_file(vac_analysis, "D:/manu/vac_analysis.json")

    if mva_analysis:
        save_analysis_to_file(mva_analysis, "D:/manu/mva_analysis.json")

    # Compare the files
    if vac_analysis and mva_analysis:
        comparison = compare_files(vac_analysis, mva_analysis)
        save_analysis_to_file(comparison, "D:/manu/excel_comparison.json")

    print("\n" + "="*80)
    print("ANALYSIS COMPLETE!")
    print("="*80)
    print("\nOutput files created:")
    print("  - vac_analysis.json")
    print("  - mva_analysis.json")
    print("  - excel_comparison.json")
