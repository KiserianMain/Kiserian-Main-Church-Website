const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// Get local IP address for development
function getLocalIP() {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

// Generate QR code for Expo Go
const localIP = getLocalIP();
const tunnelUrl = `exp://${localIP}:8081`; // Default Expo port

console.log('🔗 Generating QR Code for Mobile App Development');
console.log(`📱 Local URL: ${tunnelUrl}`);
console.log('📸 Scan this QR code with Expo Go on your phone');

// Generate QR code
QRCode.toDataURL(tunnelUrl, {
  width: 300,
  margin: 2,
  color: {
    dark: '#1f2937',
    light: '#fefdfb'
  }
}, (err, url) => {
  if (err) {
    console.error('❌ Error generating QR code:', err);
    return;
  }

  // Save as HTML file for easy viewing
  const html = `
<!DOCTYPE html>
<html>
<head>
    <title>SDA Church Mobile App - QR Code</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            background: linear-gradient(135deg, #3b82f6, #f59e0b);
            margin: 0; 
            padding: 20px; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            min-height: 100vh;
            color: white;
        }
        .container { 
            background: white; 
            padding: 30px; 
            border-radius: 15px; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            text-align: center;
            max-width: 400px;
        }
        .qr-container { 
            margin: 20px 0; 
            padding: 20px; 
            background: #f8f9fa; 
            border-radius: 10px; 
            display: inline-block;
        }
        .title { 
            color: #1f2937; 
            margin-bottom: 20px; 
            font-size: 24px; 
            font-weight: bold;
        }
        .url { 
            background: #e9ecef; 
            padding: 10px; 
            border-radius: 5px; 
            font-family: monospace; 
            word-break: break-all;
            margin: 10px 0;
            color: #495057;
        }
        .instructions { 
            margin-top: 20px; 
            font-size: 14px; 
            color: #6c757d;
            text-align: left;
        }
        .step { 
            margin: 10px 0; 
            padding: 10px; 
            background: #f8f9fa; 
            border-left: 4px solid #3b82f6;
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="title">📱 SDA Church Mobile App</div>
        <div class="qr-container">
            <img src="${url}" alt="QR Code" style="max-width: 100%; height: auto;" />
        </div>
        <div class="url">${tunnelUrl}</div>
        <div class="instructions">
            <h3>📸 How to Test on Phone:</h3>
            <div class="step">1. Open Expo Go on your Android phone</div>
            <div class="step">2. Scan this QR code</div>
            <div class="step">3. App will load and connect to your development server</div>
            <div class="step">4. Test the mobile app features</div>
        </div>
    </div>
</body>
</html>`;

  // Save HTML file
  const qrPath = path.join(__dirname, 'qr-code.html');
  fs.writeFileSync(qrPath, html);

  console.log(`✅ QR code saved to: ${qrPath}`);
  console.log(`🌐 Open ${qrPath} in your browser to see the QR code`);
  console.log('📱 Or scan the QR code above directly from Expo Go');
});
