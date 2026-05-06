import { useState } from 'react'
import './App.css'

function App() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: '40px', maxWidth: '800px', margin: '0 auto', textAlign: 'center', marginTop: '10vh' }}>
      <h1 style={{ fontSize: '3rem', color: '#ff9b50', marginBottom: '20px' }}>Mumaa AI Web Client</h1>
      <p style={{ fontSize: '1.2rem', color: '#4a5568', lineHeight: '1.6' }}>
        Welcome to the Mumaa AI web application. This frontend application will handle the real-time 1:1 video consultations between doctors and patients leveraging the <b>call-core</b> SDK and LiveKit infrastructure.
      </p>
      
      <div style={{ marginTop: '60px', padding: '40px', backgroundColor: '#fdf8f5', borderRadius: '16px', border: '1px solid #ffcda8' }}>
        <h2 style={{ color: '#2d3748', marginBottom: '15px' }}>Project Documentation</h2>
        <p style={{ color: '#4a5568', marginBottom: '30px' }}>
          We have built a dedicated documentation portal to help you understand the architecture, processing worker pipelines, and backend APIs.
        </p>
        <a 
          href="http://localhost:5174/" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ 
            display: 'inline-block', 
            padding: '14px 28px', 
            backgroundColor: '#ff9b50', 
            color: 'white', 
            textDecoration: 'none', 
            fontWeight: 'bold', 
            borderRadius: '8px',
            boxShadow: '0 4px 10px rgba(255, 155, 80, 0.3)',
            transition: 'opacity 0.2s'
          }}
        >
          Open Documentation Hub &rarr;
        </a>
      </div>
    </div>
  )
}

export default App
