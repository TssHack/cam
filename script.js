// --- Configuration & Global Elements ---
const { jsPDF } = window.jspdf;
const outputDiv = document.getElementById("outputArea");
const loadingIndicator = document.getElementById("loadingIndicator");
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
    if (isLoading) {
        loadingIndicator.style.display = "flex";
        outputDiv.style.display = "none"; // Hide old results during loading
        Object.values(buttons).forEach(btn => btn.disabled = true);
    } else {
        loadingIndicator.style.display = "none";
        Object.values(buttons).forEach(btn => btn.disabled = false);
    }
}

/**
 * Collects data from the form inputs.
 * @returns {object} - Object containing the input values as numbers.
 */
function collectData() {
    return {
        lift: parseFloat(document.getElementById("lift").value) || 0,
        intake1: parseFloat(document.getElementById("intake1").value) || 0,
        intake01: parseFloat(document.getElementById("intake01").value) || 0,
        exhaust1: parseFloat(document.getElementById("exhaust1").value) || 0,
        exhaust01: parseFloat(document.getElementById("exhaust01").value) || 0,
        intakeLCA: parseFloat(document.getElementById("intakeLCA").value) || 0,
        exhaustLCA: parseFloat(document.getElementById("exhaustLCA").value) || 0
    };
}

/**
 * Calculates derived camshaft timings.
 * @param {object} data - The input data object from collectData().
 * @returns {object} - Object containing calculated timings.
 */
function calculateTimings(data) {
    const { intake1, intake01, exhaust1, exhaust01, intakeLCA, exhaustLCA } = data;

    // Basic Valve Events (@1mm lift - simple angle calculation based on input)
    // Note: These might need adjustment based on precise definition (BTDC/ATDC etc.)
    const ivo1 = intakeLCA - (intake1 / 2);
    const ivc1 = intakeLCA + (intake1 / 2);
    const evo1 = exhaustLCA - (exhaust1 / 2); // Assuming symmetry
    const evc1 = exhaustLCA + (exhaust1 / 2); // Assuming symmetry

    // Lobe Separation Angle (LSA)
    const lsa = (intakeLCA + exhaustLCA) / 2;

    // Overlap Calculation (using 0.1mm duration figures, common approximation)
    // Overlap = (IntakeDur/2 - IntakeLCA) + (ExhaustDur/2 - ExhaustLCA) + 360 ?? Needs review based on convention
    // Using simpler approximation: Overlap = (IntakeDur/2 + ExhaustDur/2) - (LSA * 2)
    const overlap01 = (intake01 / 2) + (exhaust01 / 2) - (lsa * 2);

    // Cylinder Timing Crank-wise Calculations (Firing order: 1-3-4-2)
    // Base calculation for cylinder 1 (relative to 360/720 cycle, using 0.1mm timings)
    const cyl1IVO_crank = (360 + intakeLCA) - (intake01 / 2); // Example: reference point
    const cyl1EVO_crank = (360 - exhaustLCA) - (exhaust01 / 2); // Example: reference point
    // Note: These calculations might need review based on exact engine timing conventions (TDC ref etc.)

    const firingOffsets = { 1: 0, 3: 180, 4: 360, 2: 540 };
    const cylinders = [1, 3, 4, 2]; // Firing order

    const crankTimings = cylinders.map(cyl => {
        const offset = firingOffsets[cyl];
        // Ensure results are within 0-720 degree cycle
        const calculateCrankAngle = (baseAngle, offset) => {
             let angle = (baseAngle + offset) % 720;
             return angle < 0 ? angle + 720 : angle; // Handle potential negative modulo results
        };
        return {
            cyl,
            IVO: calculateCrankAngle(cyl1IVO_crank, offset),
            EVO: calculateCrankAngle(cyl1EVO_crank, offset)
        };
    });

    return {
        ivo1, ivc1, evo1, evc1, // Events @ 1mm
        lsa, overlap01, // Calculated metrics
        crankTimings // Crank angles per cylinder
    };
}


// --- Core Functions ---

/**
 * Displays the calculated results in the HTML output area.
 */
function showResults() {
    setLoading(true);
    try {
        const inputData = collectData();
        const calculated = calculateTimings(inputData);
        const { lift, intake1, intake01, exhaust1, exhaust01, intakeLCA, exhaustLCA } = inputData;
        const { ivo1, ivc1, evo1, evc1, lsa, overlap01, crankTimings } = calculated;

        // Generate clean HTML for the output area
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
            <small style="color: var(--text-muted-color);">(Note: IVO/IVC/EVO/EVC angles based on simple LCA +/- Duration/2 calculation. May differ from BTDC/ATDC conventions.)</small>


            <h4>Cylinder Crank Timing (Firing Order: 1-3-4-2)</h4>
            ${crankTimings.map(t => `
                <p><strong>Cylinder ${t.cyl}:</strong> Intake Opens @ ${t.IVO.toFixed(1)}° | Exhaust Opens @ ${t.EVO.toFixed(1)}°</p>
            `).join('')}
             <small style="color: var(--text-muted-color);">(Note: Crank angles relative to 720° cycle, calculated based on 0.1mm duration timings.)</small>
        `;
        outputDiv.style.display = "block"; // Show the results
    } catch (error) {
        console.error("Error displaying results:", error);
        outputDiv.innerHTML = `<p style="color: #ff6b6b;">Error calculating or displaying results. Please check input values and console.</p>`;
        outputDiv.style.display = "block";
    } finally {
        setLoading(false);
    }
}

/**
 * Generates a professional PDF report of the camshaft data.
 */
async function generatePDF() {
    setLoading(true);
    const doc = new jsPDF();

    try {
        const inputData = collectData();
        const calculated = calculateTimings(inputData);
        const { lift, intake1, intake01, exhaust1, exhaust01, intakeLCA, exhaustLCA } = inputData;
        const { ivo1, ivc1, evo1, evc1, lsa, overlap01, crankTimings } = calculated;
        const currentDate = new Date().toLocaleDateString('en-US'); // Or 'fa-IR' for Persian date

        // --- PDF Styling & Constants ---
        const primaryColor = '#00aaff'; // Use hex for jsPDF
        const secondaryColor = '#00e5ff';
        const textColor = '#333333'; // Dark text for readability on white
        const mutedColor = '#666666';
        const headerBgColor = '#1f2937'; // Dark background for header
        const headerTextColor = '#FFFFFF';
        const pageMargin = 15;
        const contentWidth = doc.internal.pageSize.getWidth() - 2 * pageMargin;
        const logoWidth = 25; // Width of logo in PDF
        const logoHeight = 25; // Height of logo in PDF
        let yPos = 0; // Track vertical position

        // --- Load Logo ---
        let logoImage = null;
        try {
            const img = new Image();
            img.src = "goz.png";
            // Use Promise to handle image loading with await
            await new Promise((resolve, reject) => {
                img.onload = () => {
                    logoImage = img;
                    resolve();
                };
                img.onerror = (err) => {
                    console.error("Failed to load logo:", err);
                    reject("Logo load error"); // Reject the promise on error
                };
            });
        } catch (error) {
            console.warn("Could not load logo for PDF. Proceeding without it.");
            // logoImage remains null, handled later
        }


        // --- PDF Header ---
        doc.setFillColor(headerBgColor);
        doc.rect(0, 0, doc.internal.pageSize.getWidth(), 35, "F"); // Header background
        yPos = 15; // Initial Y pos for header text

        // Add logo to header if loaded
        if (logoImage) {
           doc.addImage(logoImage, 'PNG', pageMargin, yPos - logoHeight / 2, logoWidth, logoHeight);
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(headerTextColor);
        doc.text("Cam Doctor v2 - Timing Report", doc.internal.pageSize.getWidth() / 2, yPos, { align: "center" });
        yPos += 8; // Move down
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Generated: ${currentDate}`, doc.internal.pageSize.getWidth() / 2, yPos, { align: "center" });

        yPos = 50; // Starting Y position below header

        // --- Input Parameters Section ---
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(textColor);
        doc.text("Input Parameters", pageMargin, yPos);
        yPos += 6;
        doc.setLineWidth(0.3);
        doc.setDrawColor(primaryColor);
        doc.line(pageMargin, yPos, pageMargin + contentWidth, yPos); // Underline
        yPos += 8;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(mutedColor); // Use muted for labels

        // Layout inputs in two columns
        const col1X = pageMargin + 5;
        const col2X = pageMargin + contentWidth / 2 + 5;
        const initialY = yPos;

        doc.text("Valve Lift:", col1X, yPos); doc.setTextColor(textColor); doc.text(`${lift} mm`, col1X + 45, yPos);
        doc.setTextColor(mutedColor); yPos += 7;
        doc.text("Intake Dur (@1mm):", col1X, yPos); doc.setTextColor(textColor); doc.text(`${intake1}°`, col1X + 45, yPos);
         doc.setTextColor(mutedColor); yPos += 7;
        doc.text("Intake Dur (@0.1mm):", col1X, yPos); doc.setTextColor(textColor); doc.text(`${intake01}°`, col1X + 45, yPos);
         doc.setTextColor(mutedColor); yPos += 7;
        doc.text("Intake LCA:", col1X, yPos); doc.setTextColor(textColor); doc.text(`${intakeLCA}°`, col1X + 45, yPos);

        // Reset Y for second column
        yPos = initialY;
        doc.setTextColor(mutedColor);

        doc.text("Exhaust Dur (@1mm):", col2X, yPos); doc.setTextColor(textColor); doc.text(`${exhaust1}°`, col2X + 50, yPos);
        doc.setTextColor(mutedColor); yPos += 7;
        doc.text("Exhaust Dur (@0.1mm):", col2X, yPos); doc.setTextColor(textColor); doc.text(`${exhaust01}°`, col2X + 50, yPos);
        doc.setTextColor(mutedColor); yPos += 7;
        doc.text("Exhaust LCA:", col2X, yPos); doc.setTextColor(textColor); doc.text(`${exhaustLCA}°`, col2X + 50, yPos);

        yPos += 15; // Space after input section

        // --- Calculated Values Section ---
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(textColor);
        doc.text("Calculated Valve Events & Metrics", pageMargin, yPos);
        yPos += 6;
        doc.setDrawColor(primaryColor);
        doc.line(pageMargin, yPos, pageMargin + contentWidth, yPos); // Underline
        yPos += 8;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(mutedColor);

        // Two columns again
        yPos = addPdfTextPair(doc, "LSA:", `${lsa.toFixed(1)}°`, col1X, yPos, 45, textColor, mutedColor);
        yPos = addPdfTextPair(doc, "Overlap (@0.1mm):", `${overlap01.toFixed(1)}°`, col1X, yPos, 45, textColor, mutedColor);
        yPos = addPdfTextPair(doc, "IVO (@1mm):", `${ivo1.toFixed(1)}°`, col1X, yPos, 45, textColor, mutedColor);
        yPos = addPdfTextPair(doc, "IVC (@1mm):", `${ivc1.toFixed(1)}°`, col1X, yPos, 45, textColor, mutedColor);

        // Reset Y for second column
        yPos = initialY + 14; // Align with second row of first column

        yPos = addPdfTextPair(doc, "EVO (@1mm):", `${evo1.toFixed(1)}°`, col2X, yPos, 45, textColor, mutedColor);
        yPos = addPdfTextPair(doc, "EVC (@1mm):", `${evc1.toFixed(1)}°`, col2X, yPos, 45, textColor, mutedColor);


        yPos += 15; // Space after calculated section


        // --- Cylinder Crank Timing Section ---
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(textColor);
        doc.text("Cylinder Crank Timing (Firing Order: 1-3-4-2)", pageMargin, yPos);
        yPos += 6;
        doc.setDrawColor(primaryColor);
        doc.line(pageMargin, yPos, pageMargin + contentWidth, yPos); // Underline
        yPos += 8;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);

        crankTimings.forEach(t => {
            let lineText = `Cylinder ${t.cyl}:  Intake Opens @ ${t.IVO.toFixed(1)}°   |   Exhaust Opens @ ${t.EVO.toFixed(1)}°`;
            doc.setTextColor(mutedColor);
            doc.text(lineText, pageMargin + 5, yPos);
            yPos += 7;
        });

        // --- PDF Footer ---
        const pageHeight = doc.internal.pageSize.getHeight();
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(mutedColor);
        const footerText = "Report generated by Cam Doctor v2 | @hyper_cams | Developed by @abj0o";
        doc.text(footerText, pageMargin, pageHeight - 10);
        doc.text(`Page 1 of 1`, contentWidth + pageMargin, pageHeight - 10, { align: "right" });


        // --- Save PDF ---
        doc.save("Cam_Doctor_Report_v2.pdf");

    } catch (error) {
        console.error("Error generating PDF:", error);
        alert("Failed to generate PDF. Please check console for details."); // User feedback
    } finally {
        setLoading(false);
    }
}

// Helper function for adding label/value pairs to PDF easily
function addPdfTextPair(doc, label, value, x, y, labelWidth, valueColor, labelColor, spacing = 7) {
    doc.setTextColor(labelColor);
    doc.text(label, x, y);
    doc.setTextColor(valueColor);
    doc.text(value, x + labelWidth, y);
    return y + spacing; // Return the next Y position
}


/**
 * Exports the output area as a PNG image.
 */
async function exportAsImage() {
    // Ensure results are visible first
    if (outputDiv.style.display === 'none') {
        showResults(); // Calculate and display if not already visible
        // Give a brief moment for the DOM to update before capturing
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // If still hidden after trying to show, abort.
     if (outputDiv.style.display === 'none') {
         alert("Please generate the output first before exporting as image.");
         return;
     }

    setLoading(true);

    try {
        // Options for html2canvas for better quality/appearance
        const canvasOptions = {
            scale: 2, // Increase resolution
            useCORS: true, // If using external images/fonts (though not here)
            backgroundColor: '#0f172a', // Set explicit background similar to body
            logging: false // Disable console logging from html2canvas
        };

        const canvas = await html2canvas(outputDiv, canvasOptions);

        const link = document.createElement('a');
        link.download = 'Cam_Doctor_Output_v2.png';
        link.href = canvas.toDataURL("image/png");
        link.click();
        link.remove(); // Clean up the temporary link

    } catch (error) {
        console.error("Error exporting image:", error);
        alert("Failed to export image. Please check console for details.");
    } finally {
        setLoading(false);
    }
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Set current year in footer
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }
});

