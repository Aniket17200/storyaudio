import { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false); // State to track if audio is playing
  const [showInput, setShowInput] = useState(true); // State to toggle input visibility
  const audioRef = useRef<HTMLAudioElement | null>(null); // Ref for the audio element

  const handleSend = async () => {
    if (!inputText.trim()) {
      setError('Input text cannot be empty.');
      return;
    }

    setLoading(true);
    setImageSrc(null);
    setAudioSrc(null);
    setError(null);
    setShowInput(false); // Hide input box when button is clicked

    try {
      const response = await fetch('http://localhost:3000/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: inputText }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch from backend. Status: ${response.status}`);
      }

      const data = await response.json();
      setImageSrc(data.imageUrl); // Set the image URL
      setAudioSrc(data.audioUrl); // Set the audio URL
    } catch (error) {
      console.error('Error:', error);
      setError('An unexpected error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handlePlay = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleBack = () => {
    setShowInput(true); // Show input box
    setImageSrc(null);
    setAudioSrc(null);
    setError(null);
  };

  useEffect(() => {
    if (audioSrc) {
      setIsPlaying(false); // Reset isPlaying when a new audio is loaded
    }
  }, [audioSrc]);

  useEffect(() => {
    if (imageSrc) {
      // Center the image when it is displayed
      document.querySelector('.result-container')?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [imageSrc]);

  return (
    <div className="background">
      <span className="ball"></span>
      <span className="ball"></span>
      <span className="ball"></span>
      <span className="ball"></span>
      <span className="ball"></span>
      <span className="ball"></span>

      {showInput && (
        <div className="input-container">
          <input
            type="text"
            placeholder="Type your story here..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button onClick={handleSend} disabled={loading}>
            {loading ? 'Generating...' : 'Send'}
          </button>
        </div>
      )}

      {loading && (
        <div className="loading-container">
          <p>Generating your story... Please wait.</p>
          <div className="spinner"></div>
        </div>
      )}

      {error && (
        <div className="error-container">
          <p className="error-message">{error}</p>
        </div>
      )}

      {imageSrc && (
        <div className="result-container">
          <img src={imageSrc} alt="Generated Thumbnail" className="thumbnail" />
        </div>
      )}

      {audioSrc && (
        <div className="result-container">
          <audio
            ref={audioRef}
            autoPlay
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          >
            <source src={audioSrc} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
          {isPlaying ? (
            <button onClick={handlePause} className="pause-button">
              Pause
            </button>
          ) : (
            <button onClick={handlePlay} className="play-button">
              Play
            </button>
          )}
          <button onClick={handleBack} className="back-button">
            Back
          </button>
        </div>
      )}
    </div>
  );
}

export default App;