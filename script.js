// --- Configuration & Global Elements ---
const { jsPDF } = window.jspdf;
const outputDiv = document.getElementById("outputArea");
const loadingIndicator = document.getElementById("loadingIndicator");
const form = document.getElementById("camForm");
const formErrorMessageDiv = document.getElementById("formErrorMessage");
const allInputs = form.querySelectorAll('input[type="number"]');
const buttons = {
    pdf: document.getElementById("btnGeneratePdf"),
    output: document.getElementById("btnShowOutput"),
    image: document.getElementById("btnExportImage")
};
const currentYearSpan = document.getElementById("currentYear");

// --- Utility Functions ---

/**
 * Sets the loading state for UI elements.
 * @param {boolean} isLoading - True to show loading, false to hide.
 */
function setLoading(isLoading) {
    // Hide error messages when starting loading
    if (isLoading) {
        formErrorMessageDiv.style.display = "none";
        formErrorMessageDiv.innerHTML = "";
        outputDiv.style.display = "none"; // Hide results during loading
        loadingIndicator.style.display = "flex";
        Object.values(buttons).forEach(btn => btn.disabled = true);
        allInputs.forEach(input => input.disabled = true); // Disable inputs too
    } else {
        loadingIndicator.style.display = "none";
        Object.values(buttons).forEach(btn => btn.disabled = false);
        allInputs.forEach(input => input.disabled = false); // Re-enable inputs
    }
}

/**
 * Validates the form inputs.
 * @returns {Array} - An array of error messages. Empty if valid.
 */
function validateForm() {
    const errors = [];
    allInputs.forEach(input => {
        input.classList.remove('invalid'); // Reset invalid style
        const value = input.value.trim();
        const label = input.previousElementSibling?.textContent || input.id; // Get label text

        if (value === "") {
            errors.push(`Field "${label}" is required.`);
            input.classList.add('invalid');
        } else if (isNaN(parseFloat(value)) || !isFinite(value)) {
             // isNaN checks for non-numeric, !isFinite checks for Infinity/-Infinity
            errors.push(`Field "${label}" must be a valid number.`);
            input.classList.add('invalid');
        }
    });
    return errors;
}

/**
 * Displays form validation errors.
 * @param {Array} errors - Array of error messages.
 */
function displayErrors(errors) {
    if (errors.length > 0) {
        formErrorMessageDiv.innerHTML = `<strong>Please fix the following errors:</strong><ul>${errors.map(e => `<li>${e}</li>`).join('')}</ul>`;
        formErrorMessageDiv.style.display = "block";
        setLoading(false); // Ensure loading is off if validation fails immediately
    } else {
        formErrorMessageDiv.style.display = "none";
        formErrorMessageDiv.innerHTML = "";
    }
}


/**
 * Collects data from the form inputs (assumes validation passed).
 * @returns {object|null} - Object containing the input values as numbers, or null if validation failed.
 */
function collectData() {
     // Clear previous errors and validate
    allInputs.forEach(input => input.classList.remove('invalid'));
    const errors = validateForm();
    displayErrors(errors);

    if (errors.length > 0) {
        return null; // Indicate validation failure
    }

    // If valid, collect data
    const data = {};
     allInputs.forEach(input => {
        data[input.id] = parseFloat(input.value);
    });
    return data;
}


/**
 * Calculates derived camshaft timings.
 * @param {object} data - The input data object from collectData().
 * @returns {object} - Object containing calculated timings.
 */
function calculateTimings(data) {
    // ... (Calculation logic remains the same as previous version)
    const { intake1, intake01, exhaust1, exhaust01, intakeLCA, exhaustLCA } = data;
    const ivo1 = intakeLCA - (intake1 / 2);
    const ivc1 = intakeLCA + (intake1 / 2);
    const evo1 = exhaustLCA - (exhaust1 / 2);
    const evc1 = exhaustLCA + (exhaust1 / 2);
    const lsa = (intakeLCA + exhaustLCA) / 2;
    const overlap01 = (intake01 / 2) + (exhaust01 / 2) - (lsa * 2);
    const cyl1IVO_crank = (360 + intakeLCA) - (intake01 / 2);
    const cyl1EVO_crank = (360 - exhaustLCA) - (exhaust01 / 2);
    const firingOffsets = { 1: 0, 3: 180, 4: 360, 2: 540 };
    const cylinders = [1, 3, 4, 2];
    const crankTimings = cylinders.map(cyl => {
        const offset = firingOffsets[cyl];
        const calculateCrankAngle = (baseAngle, offset) => {
             let angle = (baseAngle + offset) % 720;
             return angle < 0 ? angle + 720 : angle;
        };
        return {
            cyl,
            IVO: calculateCrankAngle(cyl1IVO_crank, offset),
            EVO: calculateCrankAngle(cyl1EVO_crank, offset)
        };
    });
    return {
        ivo1, ivc1, evo1, evc1, lsa, overlap01, crankTimings
    };
}


// --- Core Functions ---

/**
 * Displays the calculated results in the HTML output area.
 */
function showResults() {
    const inputData = collectData(); // This now includes validation
    if (!inputData) return; // Stop if validation failed

    setLoading(true); // Set loading only after validation passes
    try {
        const calculated = calculateTimings(inputData);
        // ... (HTML generation logic remains mostly the same as previous version)
        const { lift, intake1, intake01, exhaust1, exhaust01, intakeLCA, exhaustLCA } = inputData;
        const { ivo1, ivc1, evo1, evc1, lsa, overlap01, crankTimings } = calculated;

        outputDiv.innerHTML = `
            <h3>Calculation Results</h3>
            <h4>Input Parameters</h4>
            <p><strong>Valve Lift:</strong> ${lift} mm</p>
            <p><strong>Intake Duration (@1mm):</strong> ${intake1}°</p>
            <p><strong>Intake Duration (@0.1mm):</strong> ${intake01}°</p>
            <p><strong>Exhaust Duration (@1mm):</strong> ${exhaust1}°</p>
            <p><strong>Exhaust Duration (@0.1mm):</strong> ${exhaust01}°</p>
            <p><strong>Intake LCA:</strong> ${intakeLCA}°</p>
            <p><strong>Exhaust LCA:</strong> ${exhaustLCA}°</p>

            <h4>Calculated Valve Events & Metrics</h4>
            <p><strong>Lobe Separation Angle (LSA):</strong> ${lsa.toFixed(1)}°</p>
            <p><strong>Overlap (@0.1mm Duration):</strong> ${overlap01.toFixed(1)}°</p>
            <p><strong>Intake Valve Open (@1mm):</strong> ${ivo1.toFixed(1)}°</p>
            <p><strong>Intake Valve Close (@1mm):</strong> ${ivc1.toFixed(1)}°</p>
            <p><strong>Exhaust Valve Open (@1mm):</strong> ${evo1.toFixed(1)}°</p>
            <p><strong>Exhaust Valve Close (@1mm):</strong> ${evc1.toFixed(1)}°</p>
            <small>(Note: IVO/IVC/EVO/EVC angles based on simple LCA +/- Duration/2 calculation.)</small>

            <h4>Cylinder Crank Timing (Firing Order: 1-3-4-2)</h4>
            ${crankTimings.map(t => `
                <p><strong>Cylinder ${t.cyl}:</strong> Intake Opens @ ${t.IVO.toFixed(1)}° | Exhaust Opens @ ${t.EVO.toFixed(1)}°</p>
            `).join('')}
            <small>(Note: Crank angles relative to 720° cycle, based on 0.1mm duration timings.)</small>
        `;
        outputDiv.style.display = "block";

    } catch (error) {
        console.error("Error displaying results:", error);
        displayErrors([`An unexpected error occurred: ${error.message}`]); // Show error in UI
        outputDiv.style.display = "none";
    } finally {
        setLoading(false);
    }
}

/**
 * Generates a professional PDF report (Layout Revised).
 */
async function generatePDF() {
    const inputData = collectData(); // Validate first
    if (!inputData) return;

    setLoading(true);
    const doc = new jsPDF({
        orientation: 'p', // portrait
        unit: 'mm',       // millimeters
        format: 'a4'      // standard A4 size
    });

    try {
        const calculated = calculateTimings(inputData);
        const { lift, intake1, intake01, exhaust1, exhaust01, intakeLCA, exhaustLCA } = inputData;
        const { ivo1, ivc1, evo1, evc1, lsa, overlap01, crankTimings } = calculated;
        const currentDate = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY format

        // --- PDF Styling & Layout Constants ---
        const primaryColor = '#0ea5e9'; // Use hex
        const secondaryColor = '#14b8a6';
        const textColor = '#2d3748'; // Dark Gray for text (better contrast)
        const mutedColor = '#718096'; // Medium Gray
        const headerBgColor = '#1e293b'; // slate-800
        const headerTextColor = '#FFFFFF';
        const pageMargin = 15; // mm
        const contentWidth = doc.internal.pageSize.getWidth() - 2 * pageMargin;
        const logoWidth = 20;
        const logoHeight = 20;
        const lineHeight = 6; // Vertical space per line (mm)
        const sectionGap = 10; // Space between sections (mm)
        let yPos = 0; // Track vertical position (mm)

        // --- Load Logo ---
        let logoImage = null;
        try {
            // ... (Logo loading logic remains the same as previous version)
            const img = new Image();
            img.src = "goz.png";
            await new Promise((resolve, reject) => {
                img.onload = () => { logoImage = img; resolve(); };
                img.onerror = (err) => { console.error("Failed to load logo:", err); reject("Logo load error"); };
            });
        } catch (error) {
            console.warn("Could not load logo for PDF.");
        }

        // --- PDF Header ---
        doc.setFillColor(headerBgColor);
        doc.rect(0, 0, doc.internal.pageSize.getWidth(), 30, "F"); // Slightly shorter header
        yPos = 12; // Center text vertically

        if (logoImage) {
           doc.addImage(logoImage, 'PNG', pageMargin, yPos - logoHeight / 2, logoWidth, logoHeight);
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(headerTextColor);
        doc.text("Cam Doctor v2.1 - Timing Report", doc.internal.pageSize.getWidth() / 2, yPos + 1, { align: "center" }); // Adjust Y slightly for better centering
        yPos += 6;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`Generated: ${currentDate}`, doc.internal.pageSize.getWidth() / 2, yPos + 1, { align: "center" });

        yPos = 40; // Starting Y position below header

        // --- Helper for drawing section headers ---
        const drawSectionHeader = (title) => {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(primaryColor);
            doc.text(title, pageMargin, yPos);
            yPos += 2; // Space before line
            doc.setLineWidth(0.2);
            doc.setDrawColor(primaryColor);
            doc.line(pageMargin, yPos, pageMargin + contentWidth, yPos); // Underline
            yPos += lineHeight; // Space after line
        };

        // --- Helper for adding text pairs (label: value) ---
        // Returns the *next* yPos
        const addTextPair = (label, value, x, currentY, labelWidth = 45) => {
            doc.setFont('helvetica', 'bold'); // Bolder labels
            doc.setFontSize(9);
            doc.setTextColor(mutedColor);
            doc.text(label, x, currentY, { align: 'left' });

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(textColor);
            doc.text(value, x + labelWidth, currentY, { align: 'left' });
            return currentY + lineHeight; // Return next position
        };

        // --- Input Parameters Section ---
        drawSectionHeader("Input Parameters");
        const col1X = pageMargin + 2; // Indent slightly
        const col2X = pageMargin + contentWidth / 2 + 5; // Start of second column
        let startY = yPos;

        yPos = addTextPair("Valve Lift:", `${lift} mm`, col1X, yPos);
        yPos = addTextPair("Intake Dur (@1mm):", `${intake1}°`, col1X, yPos);
        yPos = addTextPair("Intake Dur (@0.1mm):", `${intake01}°`, col1X, yPos);
        yPos = addTextPair("Intake LCA:", `${intakeLCA}°`, col1X, yPos);
        let endY1 = yPos;

        // Reset Y for second column, align with startY
        yPos = startY;
        yPos = addTextPair("Exhaust Dur (@1mm):", `${exhaust1}°`, col2X, yPos);
        yPos = addTextPair("Exhaust Dur (@0.1mm):", `${exhaust01}°`, col2X, yPos);
        yPos = addTextPair("Exhaust LCA:", `${exhaustLCA}°`, col2X, yPos);
        let endY2 = yPos;

        // Set yPos to the bottom of the longest column + gap
        yPos = Math.max(endY1, endY2) + sectionGap / 2;

        // --- Calculated Values Section ---
        drawSectionHeader("Calculated Valve Events & Metrics");
        startY = yPos;
        yPos = addTextPair("LSA:", `${lsa.toFixed(1)}°`, col1X, yPos);
        yPos = addTextPair("Overlap (@0.1mm):", `${overlap01.toFixed(1)}°`, col1X, yPos);
        yPos = addTextPair("IVO (@1mm):", `${ivo1.toFixed(1)}°`, col1X, yPos);
        yPos = addTextPair("IVC (@1mm):", `${ivc1.toFixed(1)}°`, col1X, yPos);
        endY1 = yPos;

        // Reset Y for second column
        yPos = startY;
        yPos = addTextPair("EVO (@1mm):", `${evo1.toFixed(1)}°`, col2X, yPos);
        yPos = addTextPair("EVC (@1mm):", `${evc1.toFixed(1)}°`, col2X, yPos);
        endY2 = yPos;

        yPos = Math.max(endY1, endY2) + sectionGap / 2;


        // --- Cylinder Crank Timing Section ---
        drawSectionHeader("Cylinder Crank Timing (Firing Order: 1-3-4-2)");
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(textColor);

        // Simple table-like structure
        const cylColX = pageMargin + 5;
        const intakeColX = pageMargin + 35;
        const exhaustColX = pageMargin + 95;

        // Header row (optional, but adds clarity)
         doc.setFont('helvetica', 'bold');
         doc.setTextColor(mutedColor);
         doc.text("Cylinder", cylColX, yPos);
         doc.text("Intake Open (° Crank)", intakeColX, yPos);
         doc.text("Exhaust Open (° Crank)", exhaustColX, yPos);
         yPos += 2; // space before line
         doc.setDrawColor(mutedColor);
         doc.setLineWidth(0.1);
         doc.line(pageMargin, yPos, pageMargin + contentWidth, yPos); // Separator line
         yPos += lineHeight -1;
         doc.setFont('helvetica', 'normal');
         doc.setTextColor(textColor);


        crankTimings.forEach(t => {
            doc.text(`${t.cyl}`, cylColX, yPos);
            doc.text(`${t.IVO.toFixed(1)}°`, intakeColX, yPos);
            doc.text(`${t.EVO.toFixed(1)}°`, exhaustColX, yPos);
            yPos += lineHeight;
        });

        yPos += sectionGap / 2; // Add gap after the section

        // --- Notes Section ---
        yPos += 5; // Add some extra space before notes
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(mutedColor);
        const notes = [
            "Note: IVO/IVC/EVO/EVC angles based on simple LCA +/- Duration/2 calculation.",
            "Note: Crank angles relative to 720° cycle, based on 0.1mm duration timings.",
            "Note: Overlap calculated using 0.1mm duration values."
        ];
         notes.forEach(note => {
            doc.text(note, pageMargin, yPos);
            yPos += lineHeight - 2; // Tighter spacing for notes
        });

        // --- PDF Footer ---
        const pageHeight = doc.internal.pageSize.getHeight();
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(mutedColor);
        // Draw a line above footer
        doc.setLineWidth(0.1);
        doc.setDrawColor(mutedColor);
        doc.line(pageMargin, pageHeight - 15, pageMargin + contentWidth, pageHeight - 15);
        const footerText = "Report generated by Cam Doctor v2.1 | Owner: @hyper_cams | Developed by @abj0o";
        doc.text(footerText, pageMargin, pageHeight - 10);
        doc.text(`Page 1 of 1`, contentWidth + pageMargin - 10, pageHeight - 10, { align: "right" });


        // --- Save PDF ---
        doc.save("Cam_Doctor_Report_v2.1.pdf");

    } catch (error) {
        console.error("Error generating PDF:", error);
        displayErrors([`Failed to generate PDF: ${error.message}`]); // Show error in UI
    } finally {
        setLoading(false);
    }
}


/**
 * Exports the output area as a PNG image.
 */
async function exportAsImage() {
    const inputData = collectData(); // Validate first
    if (!inputData) return;

    // Ensure results are visible for capture
    if (outputDiv.style.display === 'none') {
        showResults(); // Calculate and display if not already visible
        // Check if showResults failed (e.g., due to calculation error)
        if (outputDiv.style.display === 'none') {
             displayErrors(["Cannot export image until output is successfully generated."]);
             return;
        }
        // Give a brief moment for the DOM to update before capturing
        await new Promise(resolve => setTimeout(resolve, 150));
    }

    setLoading(true);

    try {
        const canvasOptions = {
            scale: 2.5, // Higher resolution for image
            useCORS: true,
            backgroundColor: '#1e293b', // Match body background end color (or a solid color)
            logging: false
        };
        const canvas = await html2canvas(outputDiv, canvasOptions);
        const link = document.createElement('a');
        link.download = 'Cam_Doctor_Output_v2.1.png';
        link.href = canvas.toDataURL("image/png", 0.95); // Slightly compress PNG
        link.click();
        link.remove();

    } catch (error) {
        console.error("Error exporting image:", error);
         displayErrors([`Failed to export image: ${error.message}`]); // Show error in UI
    } finally {
        setLoading(false);
    }
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }
    // Add event listener to clear errors when user starts typing again
    allInputs.forEach(input => {
        input.addEventListener('input', () => {
            // Only clear if there's an error message currently displayed
            if (formErrorMessageDiv.style.display === 'block') {
                 input.classList.remove('invalid'); // Remove invalid style from current input
                 // Optionally, clear all errors immediately, or wait for next validation
                 // formErrorMessageDiv.style.display = 'none';
                 // formErrorMessageDiv.innerHTML = '';
            }
        });
    });
});

