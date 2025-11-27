import { useState, useRef } from 'react'
import QRCode from 'qrcode.react'
import './App.css'

function App() {
  const [inputValue, setInputValue] = useState('https://exemple.com')
  const qrRef = useRef()

  const handleDownload = () => {
    const canvas = qrRef.current.querySelector('canvas')
    const url = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = 'qrcode.png'
    link.href = url
    link.click()
  }

  return (
    <div className="container">
      <div className="card">
        <h1>🎯 Générateur QR Code</h1>
        <p className="subtitle">Créez votre code QR en quelques secondes</p>
        
        <div className="input-group">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Entrez une URL ou du texte..."
            className="input"
          />
        </div>

        <div className="qr-container">
          <div ref={qrRef} className="qr-wrapper">
            {inputValue && (
              <QRCode
                value={inputValue}
                size={300}
                level="H"
                includeMargin={true}
                fgColor="#667eea"
                bgColor="#ffffff"
              />
            )}
          </div>
        </div>

        <button onClick={handleDownload} className="btn-download">
          📥 Télécharger
        </button>

        <div className="info">
          <p><strong>Caractères:</strong> {inputValue.length}</p>
        </div>
      </div>
    </div>
  )
}

export default App
