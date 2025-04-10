async function generatePDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const data = collectData();
  const { lift, intake1, intake01, exhaust1, exhaust01, intakeLCA, exhaustLCA } = data;

  const ivo = intakeLCA - (intake1 / 2);
  const ivc = intakeLCA + (intake1 / 2);
  const evo = exhaustLCA - (exhaust1 / 2);
  const evc = exhaustLCA + (exhaust1 / 2);

  // Header Style
  doc.setFillColor(0, 87, 217); // blue
  doc.rect(0, 0, 210, 20, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text("Cam Doctor v1 - Valve Timing Report", 105, 13, { align: "center" });

  // Section Box
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

  // Timing Box
  doc.setFillColor(238, 247, 255); // light blue
  doc.roundedRect(15, 120, 180, 30, 3, 3, "F");
  doc.setTextColor(0, 87, 217);
  doc.setFontSize(13);
  doc.text(`IVO: Opens @ ${ivo}° | IVC: Closes @ ${ivc}°`, 25, 135);
  doc.text(`EVO: Opens @ ${evo}° | EVC: Closes @ ${evc}°`, 25, 145);

  // Footer
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text("Generated by Cam Doctor v1 | Developed by Shafaq", 105, 280, { align: "center" });

  doc.save("cam_doctor_report.pdf");
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

  const outputDiv = document.getElementById("outputArea");
  outputDiv.innerHTML = `
    <h3>Output Summary</h3>
    <p><strong>Valve Lift:</strong> ${lift} mm</p>
    <p><strong>Intake Duration @1mm:</strong> ${intake1} deg</p>
    <p><strong>Exhaust Duration @1mm:</strong> ${exhaust1} deg</p>
    <p><strong>IVO:</strong> Opens @ ${ivo}°, <strong>IVC:</strong> Closes @ ${ivc}°</p>
    <p><strong>EVO:</strong> Opens @ ${evo}°, <strong>EVC:</strong> Closes @ ${evc}°</p>
  `;
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
