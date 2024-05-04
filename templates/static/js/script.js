const analyzeBtn = document.getElementById('analyze-btn');
const resultsDiv = document.getElementById('results');
const imgdisp = document.getElementById('disp-scan')
const cgptbutton = document.getElementById('cgpt-btn')
const cgptcont = document.getElementById('cgpt-container')
const loadingAnimation = document.getElementById('loading-animation');

cgptbutton.addEventListener('click', async () => {
  try {
    loadingAnimation.style.display = 'block';
    const response = await fetch('/cgpt_suggest', {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }

    const responseText = await response.json();
    const cgptText = responseText.cgpt_text;

    // Format and populate the content
    const formattedText = formatCGPTText(cgptText);
    populateContent(formattedText);
        
  } catch (error) {
    console.error('Error fetching data:', error);
  }
  finally{
    loadingAnimation.style.display = 'none';
  }
});

function formatCGPTText(text) {
  // Remove #, *, and - signs from the text
  const cleanedText = text.replace(/[#*-]/g, '');

  // Split the cleaned text into sections
  const sections = cleanedText.split(/\n\n+/);

  // Format each section
  const formattedSections = sections.map(section => {
    // Split the section into lines
    const lines = section.split('\n');

    // Extract the heading and content
    const heading = lines.shift();
    const content = lines.map(line => `<li>${line}</li>`).join('');

    // Format the section with heading and content
    return `<div><h3>${heading}</h3><ul>${content}</ul></div>`;
  });

  // Join all formatted sections into a single string
  return formattedSections.join('');
}


function populateContent(text) {
  // Get the container element
  const cgptContainer = document.getElementById('cgpt-container');

  // Set the formatted text as the HTML content of the container
  cgptContainer.innerHTML = text;
}


analyzeBtn.addEventListener('click', async () => {
  const age = document.getElementById('age').value;
  const sex = document.getElementById('sex').value;
  const leftscanImage = document.getElementById('left-scan-image').files[0];
  const rightscanImage = document.getElementById('right-scan-image').files[0];

  // Basic form validation (you can add more as needed)
  if (!age || !sex || !leftscanImage) {
    alert('Please fill in all fields and select a retinal scan image.');
    return;
  }

  // Simulate sending data to a Flask backend (replace with actual API call)
  const formData = new FormData();
  formData.append('age', age);
  formData.append('sex', sex);
  formData.append('left-scan', leftscanImage);
  formData.append('right-scan', rightscanImage);
  loadingAnimation.style.display = 'block';
  const response = await fetch('/analyze', {
    method: 'POST',
    body: formData,
  });

  // Simulate receiving data from the backend (replace with actual data parsing)
  const data = await response.json();
  const diseases = Object.entries(data);

  // Clear previous results
  resultsDiv.innerHTML = '';
  imgdisp.innerHTML = '';
  // After fetching data and clearing previous results
  const leftImageContainer = document.createElement('div');
  leftImageContainer.classList.add('image-container');

  const rightImageContainer = document.createElement('div');
  rightImageContainer.classList.add('image-container');

  // Create image elements for left and right scans
  const leftImage = document.createElement('img');
  leftImage.src = URL.createObjectURL(leftscanImage);
  leftImage.alt = 'Left Scan';
  leftImage.classList.add('scan-image');

  const rightImage = document.createElement('img');
  rightImage.src = URL.createObjectURL(rightscanImage);
  rightImage.alt = 'Right Scan';
  rightImage.classList.add('scan-image');

  // Append images to their respective containers
  leftImageContainer.appendChild(leftImage);
  rightImageContainer.appendChild(rightImage);

  // Append containers to the resultsDiv

  // After fetching data and clearing previous results
  const leftLabel = document.createElement('div');
  leftLabel.textContent = 'Left Image';
  leftLabel.classList.add('image-label');

  const rightLabel = document.createElement('div');
  rightLabel.textContent = 'Right Image';
  rightLabel.classList.add('image-label');

  // Append labels to the resultsDiv
  leftImageContainer.appendChild(leftLabel);
  rightImageContainer.appendChild(rightLabel);
  imgdisp.appendChild(leftImageContainer);
  imgdisp.appendChild(rightImageContainer);
  resultsDiv.appendChild(imgdisp)

  // Check if any diseases are detected
  if (diseases.length > 0) {
    // Create a canvas element
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Define canvas size
    const canvasWidth = 1250;
    const canvasHeight = 400;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Append canvas to resultsDiv
    resultsDiv.appendChild(canvas);

    let x = 10; // Starting position for squares
    let y = 10; // Starting position for text

    // Calculate max confidence
    const maxConfidence = Math.max(...diseases.map(([_, confidence]) => confidence));

    // Adjusted JavaScript code to create a histogram plot with evenly spaced bars
    const barWidth = 50;
    const barSpacing = 100;
    const totalBarsWidth = diseases.length * (barWidth + barSpacing);
    let startX = (canvasWidth - totalBarsWidth) / 2; // Starting position for the first bar

    for (const [disease, confidence] of diseases) {
      const barHeight = (confidence / maxConfidence) * (canvasHeight - 40); // Scale the bars to fit within canvas height

      const x = startX; // Calculate the x position based on the index of the disease
      const y = canvasHeight - barHeight - 20; // Adjusted y position to align bars with the bottom of the canvas

      // Draw bar
      ctx.fillStyle = '#00ffff'; // Color of the bars
      ctx.fillRect(x, y, barWidth, barHeight);

      // Display disease name below the bar
      ctx.font = '20px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(disease, x + barWidth / 2, canvasHeight - 5); // Adjusted spacing

      // Display confidence level above the bar
      ctx.font = '20px sans-serif';
      ctx.fillText(`${Math.round(confidence * 100)}%`, x + barWidth / 2, y - 5);

      // Update startX for the next bar
      startX += barWidth + barSpacing;
    }
  } else {
    resultsDiv.innerHTML = '<p>No disease detected.</p>';
  }
  loadingAnimation.style.display = 'none';
});
