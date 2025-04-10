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

function calculateAdvancedMetrics(data) {
  const { intake1, exhaust1, intakeLCA, exhaustLCA } = data;

  const ivo = intakeLCA - (intake1 / 2);
  const ivc = intakeLCA + (intake1 / 2);
  const evo = exhaustLCA - (exhaust1 / 2);
  const evc = exhaustLCA + (exhaust1 / 2);

  const overlap = Math.max(0, ivc - evo);
  const lsa = ((intakeLCA + exhaustLCA) / 2).toFixed(1);

  return {
    ivo: ivo.toFixed(1),
    ivc: ivc.toFixed(1),
    evo: evo.toFixed(1),
    evc: evc.toFixed(1),
    overlap: overlap.toFixed(1),
    lsa
  };
}

function showResults() {
  const data = collectData();
  const { lift, intake1, exhaust1 } = data;
  const metrics = calculateAdvancedMetrics(data);

  const outputDiv = document.getElementById("outputArea");
  outputDiv.innerHTML = `
    <h3>Output Summary</h3>
    <p><strong>Valve Lift:</strong> ${lift} mm</p>
    <p><strong>Intake Duration @1mm:</strong> ${intake1} deg</p>
    <p><strong>Exhaust Duration @1mm:</strong> ${exhaust1} deg</p>
    <p><strong>IVO:</strong> Opens @ ${metrics.ivo}°, <strong>IVC:</strong> Closes @ ${metrics.ivc}°</p>
    <p><strong>EVO:</strong> Opens @ ${metrics.evo}°, <strong>EVC:</strong> Closes @ ${metrics.evc}°</p>
    <p><strong>Overlap:</strong> ${metrics.overlap}°</p>
    <p><strong>LSA:</strong> ${metrics.lsa}°</p>
    <canvas id="valveChart" width="600" height="150" style="margin-top: 20px;"></canvas>
  `;
  outputDiv.style.display = "block";
  drawValveChart(metrics);
}

function drawValveChart(metrics) {
  const canvas = document.getElementById("valveChart");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const scale = canvas.width / 360;

  function drawBar(startDeg, duration, y, color, label) {
    const x = startDeg * scale;
    const width = duration * scale;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, 20);
    ctx.fillStyle = "#000";
    ctx.font = "12px sans-serif";
    ctx.fillText(label, x + 5, y + 15);
  }

  const intakeStart = parseFloat(metrics.ivo);
  const intakeDuration = parseFloat(metrics.ivc) - intakeStart;

  const exhaustStart = parseFloat(metrics.evo);
  const exhaustDuration = parseFloat(metrics.evc) - exhaustStart;

  drawBar(intakeStart, intakeDuration, 30, "#4CAF50", "Intake");
  drawBar(exhaustStart, exhaustDuration, 70, "#F44336", "Exhaust");
}

function exportAsImage() {
  const outputArea = document.querySelector(".output-area");
  outputArea.style.display = "block";
  html2canvas(outputArea).then(canvas => {
    const link = document.createElement('a');
    link.download = 'cam_doctor_output.png';
    link.href = canvas.toDataURL("image/png");
    link.click();
  });
}

async function generatePDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const data = collectData();
  const metrics = calculateAdvancedMetrics(data);

  // Header
  doc.setFillColor(0, 87, 217);
  doc.rect(0, 0, 210, 20, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text("Cam Doctor v1 - Valve Timing Report", 105, 13, { align: "center" });

  // Box
  doc.setTextColor(33, 33, 33);
  doc.setFontSize(12);
  doc.setDrawColor(0, 87, 217);
  doc.rect(15, 30, 180, 90);

  const lines = [
    `Valve Lift: ${data.lift} mm`,
    `Intake Duration @1mm: ${data.intake1}°`,
    `Intake Duration @0.1mm: ${data.intake01}°`,
    `Exhaust Duration @1mm: ${data.exhaust1}°`,
    `Exhaust Duration @0.1mm: ${data.exhaust01}°`,
    `Intake Lobe Center Angle: ${data.intakeLCA}°`,
    `Exhaust Lobe Center Angle: ${data.exhaustLCA}°`,
    `IVO: ${metrics.ivo}° | IVC: ${metrics.ivc}°`,
    `EVO: ${metrics.evo}° | EVC: ${metrics.evc}°`,
    `Overlap: ${metrics.overlap}°`,
    `LSA: ${metrics.lsa}°`
  ];

  let y = 40;
  lines.forEach((line) => {
    doc.text(line, 25, y);
    y += 10;
  });

  // Footer
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text("Generated by Cam Doctor v1 | Developed by Shafaq", 105, 280, { align: "center" });

  doc.save("cam_doctor_report.pdf");
}
