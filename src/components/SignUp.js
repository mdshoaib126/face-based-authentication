import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';  
import { Link } from 'react-router-dom';

const SignUp = () => {
  const [imageSrc, setImageSrc] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const [userData, setUserData] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null); 
  
  const initializeFaceApi = async () => {
    try {
      await faceapi.tf.setBackend('webgl');
      await faceapi.tf.ready();
    } catch (e) {
      console.warn('WebGL initialization failed, falling back to CPU backend');
      await faceapi.tf.setBackend('cpu');
      await faceapi.tf.ready();
    }

    await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
    await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
    await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
  };

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        videoRef.current.srcObject = stream;
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    initializeFaceApi().then(startVideo);
  }, []);

  const handleCapture = async () => {
    const detections = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
    if (detections) {
      const canvas = canvasRef.current;
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const image = canvas.toDataURL('image/png');
      setImageSrc(image);
      setIsCameraActive(false);

      // Store face descriptor separately
      setFaceDescriptor(detections.descriptor);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const user = {
      email: formData.get('email'),
      name: formData.get('name'),
      mobile: formData.get('mobile'),
      gender: formData.get('gender'),
      faceDescriptor: faceDescriptor,
    }; 
    // Store user data in local storage
    const users = JSON.parse(localStorage.getItem('users')) || [];
    users.push(user);
    localStorage.setItem('users', JSON.stringify(users));

    // Update state to show user card
    setUserData(user);
  };

  

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        {isCameraActive ? (
          <div className="text-center">
            <video ref={videoRef} autoPlay muted className="w-full h-auto rounded-lg mb-4"></video>
            <button onClick={handleCapture} className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600">
              Capture Image
            </button>
          </div>
        ) : faceDescriptor && !userData ? (
          <form onSubmit={handleSubmit}>
            <div className="text-center mb-4">
              <img src={imageSrc} alt="Captured" className="w-full h-auto rounded-lg mb-4" />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Email</label>
              <input type="email" name="email" required className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Name</label>
              <input type="text" name="name" required className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Mobile</label>
              <input type="tel" name="mobile" required className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Gender</label>
              <select name="gender" required className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <button type="submit" className="w-full px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600">
              Submit
            </button>
          </form>
        ) : userData ? (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Welcome, {userData.name}!</h2>
            <p className="mb-2"><strong>Email:</strong> {userData.email}</p>
            <p className="mb-2"><strong>Mobile:</strong> {userData.mobile}</p>
            <p className="mb-2"><strong>Gender:</strong> {userData.gender}</p>
            <Link to="/"> 
            <button className="mt-4 px-6 py-3 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-600">
              Sign Out
            </button>
            </Link>
          </div>
        ) : null}
        <canvas ref={canvasRef} className="hidden"></canvas>
      </div>
    </div>
  );
};

export default SignUp;
