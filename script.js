async function generatePDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const data = collectData();
  const { lift, intake1, intake01, exhaust1, exhaust01, intakeLCA, exhaustLCA } = data;

  const ivo = intakeLCA - (intake1 / 2);
  const ivc = intakeLCA + (intake1 / 2);
  const evo = exhaustLCA - (exhaust1 / 2);
  const evc = exhaustLCA + (exhaust1 / 2);

  // Cylinder Timing Crank-wise Calculations (Firing order: 1-3-4-2)
  const cyl1IVO = (360 + intakeLCA) - (intake01 / 2);
  const cyl1EVO = (360 - exhaustLCA) - (exhaust01 / 2);

  // Offsets for firing order (1-3-4-2)
  const firingOffsets = {
    1: 0,
    3: 180,
    4: 360,
    2: 540
  };

  const cylinders = [1, 3, 4, 2]; // firing order

  const crankTimings = cylinders.map(cyl => {
    const offset = firingOffsets[cyl];
    return {
      cyl,
      IVO: (cyl1IVO + offset) % 720,
      EVO: (cyl1EVO + offset) % 720
    };
  });

  // Header Style
  doc.setFillColor(0, 87, 217); // blue
  doc.rect(0, 0, 210, 20, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text("Cam Doctor v1 - Valve Timing Report", 105, 13, { align: "center" });

  // Section Box for Valve Timings
  doc.setTextColor(33, 33, 33);
  doc.setFontSize(12);
  doc.setDrawColor(0, 87, 217);
  doc.rect(15, 30, 180, 80);

  let y = 40;
  const gap = 10;
  const labels = [
    `Valve Lift: ${lift} mm`,
    `Intake Duration @1mm: ${intake1}°`,
    `Intake Duration @0.1: ${intake01}°`,
    `Exhaust Duration @1mm: ${exhaust1}°`,
    `Exhaust Duration @0.1: ${exhaust01}°`,
    `Intake Lobe Center Angle: ${intakeLCA}°`,
    `Exhaust Lobe Center Angle: ${exhaustLCA}°`
  ];

  labels.forEach((text, i) => {
    doc.text(text, 25, y + i * gap);
  });

  // Cylinder Timing Crank-wise Section
  let cyCrank = y + 85; // Start position for Cylinder Timings
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text("Cylinder Timings (Crank° based on firing order)", 105, cyCrank, { align: "center" });

  cyCrank += 10;
  doc.setFontSize(11);
  crankTimings.forEach(t => {
    doc.text(
      `Cylinder ${t.cyl} → Intake @ ${t.IVO.toFixed(1)}° | Exhaust @ ${t.EVO.toFixed(1)}°`,
      25,
      cyCrank
    );
    cyCrank += 7;
  });

  // Footer with Logo and Information
  const logo = new Image();
  logo.src = "goz.png"; // Assuming 'goz.png' is the logo's filename
  
  logo.onload = () => {
    doc.addImage(logo, 'PNG', 170, 250, 30, 30); // Logo in footer (adjust size and position as needed)
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text("Site owner: @hyper_cams | Developed by: @abj0o", 105, 270, { align: "center" });

    // Save the document as a PDF
    doc.save("cam_doctor_report.pdf");
  };
}

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

    function showResults() {
      const data = collectData();
      const { lift, intake1, intake01, exhaust1, exhaust01, intakeLCA, exhaustLCA } = data;

      const ivo = intakeLCA - (intake1 / 2);
      const ivc = intakeLCA + (intake1 / 2);
      const evo = exhaustLCA - (exhaust1 / 2);
      const evc = exhaustLCA + (exhaust1 / 2);

  // Cylinder Timings for 1-3-4-2 firing order
      const cyl1IVO = (360 + intakeLCA) - (intake01 / 2);
      const cyl1EVO = (360 - exhaustLCA) - (exhaust01 / 2);

  // Offsets for firing order (1-3-4-2)
      const firingOffsets = {
       1: 0,
       3: 180,
       4: 360,
       2: 540
     };

     const cylinders = [1, 3, 4, 2]; // firing order

     const crankTimings = cylinders.map(cyl => {
       const offset = firingOffsets[cyl];
       return {
         cyl,
         IVO: (cyl1IVO + offset) % 720,
         EVO: (cyl1EVO + offset) % 720
       };
     });

  // Output HTML
  const outputDiv = document.getElementById("outputArea");
  outputDiv.innerHTML = `
    <h3>Output Summary</h3>
    <p><strong>Valve Lift:</strong> ${lift} mm</p>
    <p><strong>Intake Duration @1mm:</strong> ${intake1}°</p>
    <p><strong>Intake Duration @0.1:</strong> ${intake01}°</p>
    <p><strong>Exhaust Duration @1mm:</strong> ${exhaust1}°</p>
    <p><strong>Exhaust Duration @0.1:</strong> ${exhaust01}°</p>
    <p><strong>IVO:</strong> Opens @ ${ivo}°, <strong>IVC:</strong> Closes @ ${ivc}°</p>
    <p><strong>EVO:</strong> Opens @ ${evo}°, <strong>EVC:</strong> Closes @ ${evc}°</p>
    
    <h4>Cylinder Timings (Crank°)</h4>
  `;

  crankTimings.forEach(t => {
    outputDiv.innerHTML += `
      <p><strong>Cylinder ${t.cyl} → Intake: </strong>${t.IVO.toFixed(1)}° | <strong>Exhaust: </strong>${t.EVO.toFixed(1)}°</p>
    `;
  });

  outputDiv.style.display = "block";
}

function exportAsImage() {
  const outputArea = document.querySelector(".output-area");
  outputArea.style.display = "block"; // اطمینان از قابل‌مشاهده بودن
  html2canvas(outputArea).then(canvas => {
    const link = document.createElement('a');
    link.download = 'cam_doctor_output.png';
    link.href = canvas.toDataURL("image/png");
    link.click();
  });
}
