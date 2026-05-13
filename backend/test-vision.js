require('dotenv').config();
const fs = require('fs');

const CAT_CONFIDENCE_THRESHOLD = 0.75;

async function detectCatInFrame(imagePath) {
  const base64Image = fs.readFileSync(imagePath).toString('base64');

  const response = await fetch('https://serverless.roboflow.com/vinayak-palya-s-workspace/workflows/yolo-world-large-demo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: process.env.ROBOFLOW_API_KEY,
      inputs: {
        image: { type: "base64", value: base64Image },
        classes: ["cat"]
      }
    })
  });

  const data = await response.json();
  console.log('Full response:', JSON.stringify(data, null, 2));

  const predictions = data?.outputs?.[0]?.predictions?.predictions || [];
  const catScores = predictions
    .filter(p => p.class?.toLowerCase() === 'cat')
    .map(p => Number(p.confidence));

  let conf01 = 0;
  if (catScores.length > 0) {
    const raw = Math.max(...catScores);
    const n = Number(raw);
    if (Number.isFinite(n)) {
      conf01 = n > 1 ? n / 100 : n;
    }
  }

  const label =
    conf01 >= CAT_CONFIDENCE_THRESHOLD ? 'cat_present' : 'cat_not_present';

  return {
    label,
    confidence: parseFloat(conf01.toFixed(3))
  };
}

detectCatInFrame('./cat.jpg').then(console.log);