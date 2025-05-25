# Excel Formula Display Features

## Overview

The Time Report system now includes enhanced Excel formula display capabilities using **SheetJS (XLSX)** for rendering Excel content with comprehensive formula support. This update allows users to view, interact with, and understand Excel formulas directly in the web interface.

## 🚀 New Features

### 1. **Formula Detection & Parsing**

- Automatically detects cells containing formulas using SheetJS's `cell.f` property
- Supports all Excel formula types (SUM, AVERAGE, IF, VLOOKUP, etc.)
- Preserves formula structure and references

### 2. **Enhanced Tooltips**

- **Hover tooltips** show complete formula strings (e.g., `=SUM(B2:B6)`)
- Display both formula and evaluated value
- Include cell formatting information
- Show cell type and reference information

### 3. **Formula Toggle Controls**

- **Show Formulas** checkbox: Switch between displaying formulas vs. evaluated values
- **Highlight Formula Cells** checkbox: Visual highlighting of cells containing formulas
- Per-sheet controls for multi-sheet workbooks
- User preferences saved in localStorage

### 4. **Visual Enhancements**

- **Formula indicator**: Small "ƒ" symbol in top-right corner of formula cells
- **Highlighting**: Blue border and background for formula cells when enabled
- **Hover effects**: Subtle scaling and color changes on hover
- **Cell type styling**: Different colors for dates, numbers, booleans, errors, and text

### 5. **Interactive Features**

- **Click-to-copy**: Click any formula cell to copy the formula to clipboard
- **Toast notifications**: User feedback for copy operations
- **Responsive design**: Works on desktop and mobile devices
- **Dark mode support**: Automatic adaptation to dark themes

## 🛠️ Technical Implementation

### Parser Libraries Used

- **ExcelJS (^4.3.0)**: For data extraction and metadata analysis
- **SheetJS/XLSX (^0.18.5)**: For HTML rendering and formula parsing

### Key Files Modified

#### 1. `utils/excelRendererService.js`

- Enhanced `renderToHtml()` method with formula options
- New `_formatCell()` method with comprehensive formula support
- Added formula detection and metadata tracking
- Improved cell type handling (dates, numbers, booleans, errors)

#### 2. `views/timeReport/showExcel.ejs`

- Added formula control UI components
- Enhanced CSS styles for formula cells
- JavaScript functions for toggle functionality
- Toast notification system

#### 3. `views/timeReport/serverExcelViewer.ejs`

- Integrated formula controls and JavaScript
- Consistent styling with main viewer

#### 4. `public/css/excel-viewer.css`

- Formula cell styling and highlighting
- Responsive design improvements
- Dark mode support
- Enhanced hover effects

## 📋 Usage Guide

### For End Users

1. **Viewing Formulas**:

   - Hover over any cell to see tooltips with formula information
   - Use the "Show Formulas" checkbox to toggle between formulas and values
   - Enable "Highlight Formula Cells" to visually identify formula cells

2. **Copying Formulas**:

   - Click on any formula cell to copy the formula to your clipboard
   - A notification will confirm the copy operation

3. **Multi-Sheet Support**:
   - Each sheet has independent formula controls
   - Switch between sheets using the tab navigation
   - Settings are preserved per sheet

### For Developers

#### Rendering Options

```javascript
const options = {
	includeFormulas: true, // Show formulas in tooltips
	showFormulas: false, // Toggle to show formulas instead of values
	highlightFormulas: true, // Highlight formula cells
	formulaTooltips: true, // Show formulas in tooltips
	maxSheets: 3, // Maximum sheets to render
	maxRows: 100, // Maximum rows per sheet
	maxCols: 20, // Maximum columns per sheet
};

const result = await excelRendererService.renderToHtml(filePath, options);
```

#### HTML Structure

```html
<!-- Formula Controls -->
<div class="formula-controls">
	<input
		type="checkbox"
		id="showFormulas_SheetName"
		onchange="toggleFormulas('SheetName', this.checked)" />
	<label for="showFormulas_SheetName">Show Formulas</label>

	<input
		type="checkbox"
		id="highlightFormulas_SheetName"
		onchange="toggleFormulaHighlight('SheetName', this.checked)" />
	<label for="highlightFormulas_SheetName">Highlight Formula Cells</label>
</div>

<!-- Formula Cell -->
<td
	class="formula-cell formula-highlighted"
	title="Formula: =SUM(B2:B6)&#10;Evaluated Value: 42"
	data-formula="SUM(B2:B6)"
	data-has-formula="true">
	<span class="cell-value">42</span>
	<span class="cell-formula" style="display: none;">=SUM(B2:B6)</span>
</td>
```

## 🎨 Styling Classes

### CSS Classes

- `.formula-cell`: Base styling for formula cells
- `.formula-highlighted`: Enhanced highlighting when enabled
- `.cell-value`: Container for evaluated values
- `.cell-formula`: Container for formula strings
- `.show-formulas`: Applied to sheet when showing formulas
- `.formula-controls`: Styling for control panel

### Data Attributes

- `data-formula`: Contains the formula string
- `data-has-formula`: Boolean indicator for formula cells
- `data-cell-type`: Excel cell type (n, d, b, e, s)
- `data-cell-ref`: Cell reference (A1, B2, etc.)

## 🧪 Testing

Run the test script to verify formula functionality:

```bash
node test-formula-parsing.js
```

The test will:

- Detect Excel files in the uploads directory
- Test different rendering options
- Verify formula detection and parsing
- Check HTML output for formula-related content

## 🔧 Configuration

### Default Options

```javascript
const defaultOptions = {
	maxSheets: 3,
	maxRows: 100,
	maxCols: 20,
	includeStyles: true,
	includeFormulas: true,
	showFormulas: false,
	highlightFormulas: true,
	formulaTooltips: true,
};
```

### SheetJS Configuration

```javascript
const workbook = XLSX.read(fileBuffer, {
	type: "buffer",
	cellStyles: true,
	cellNF: true,
	cellFormula: true, // Enable formula parsing
	cellDates: true,
	dateNF: "yyyy-mm-dd",
});
```

## 🌟 Benefits

1. **Enhanced User Experience**: Users can understand Excel calculations without downloading files
2. **Educational Value**: Students and instructors can see how calculations are performed
3. **Debugging Support**: Easy identification of formula errors or issues
4. **Accessibility**: Web-based formula viewing works across all devices
5. **Performance**: Client-side rendering with server-side parsing for optimal speed

## 🔮 Future Enhancements

Potential improvements for future versions:

- Formula syntax highlighting
- Formula dependency visualization
- Interactive formula editing
- Formula validation and error checking
- Export formulas to different formats
- Advanced formula search and filtering

## 📞 Support

For issues or questions about the formula features:

1. Check the browser console for JavaScript errors
2. Verify that the Excel file contains valid formulas
3. Test with different browsers for compatibility
4. Review the test script output for debugging information

---

**Note**: This feature requires modern browsers with JavaScript enabled and clipboard API support for optimal functionality.
