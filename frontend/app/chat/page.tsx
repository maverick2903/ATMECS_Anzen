"use client"

import { useState, useEffect, useRef } from 'react'
import { Send, Plus, Trash2, Upload, ChevronLeft, ChevronRight, Settings, Loader2,AlertCircle   } from 'lucide-react'
import {Mic, Pause, Play, Check, X} from 'lucide-react'
import { FileIcon, ImageIcon, FileSpreadsheetIcon } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Combobox } from '@/components/ui/combobox'
import Markdown from 'react-markdown'
import { set } from 'react-hook-form'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Image from "next/image";
import { LiveAudioVisualizer } from 'react-audio-visualize';
import { SponsorsSection } from '@/components/layout/sections/sponsors'

type ChatHistory = {
  id: string;
  title: string;
  messages: { role: 'user' | 'assistant'; content: string; file?: string; image?: string }[];
}

export default function Component() {
  const backend_url = "https://697f-34-124-180-206.ngrok-free.app"

  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string; file?: string; image?: string }[]>([])
  const [input, setInput] = useState('')
  const [isLeftPaneVisible, setIsLeftPaneVisible] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null)
  const [collectionName, setCollectionName] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const storedHistory = localStorage.getItem('chatHistory')
    if (storedHistory) {
      setChatHistory(JSON.parse(storedHistory))
    }
    const timer = setTimeout(() => {
        setIsInitialLoad(false)
      }, 3000) // Adjust this value to match your animation duration
    
      return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (currentChatId) {
      const currentChat = chatHistory.find(chat => chat.id === currentChatId)
      if (currentChat) {
        setMessages(currentChat.messages)
      }
    }
  }, [currentChatId, chatHistory])

  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory))
  }, [chatHistory])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [input])

  const handleSend = async () => {
    if (input.trim() === '' && !fileInputRef.current?.files?.length) return

    const newMessage = { role: 'user' as const, content: input }
    if (fileInputRef.current?.files?.length) {
      // @ts-ignore
      (newMessage as { role: 'user', content: string, file?: string }).file = fileInputRef.current.files[0].name;
      if (fileInputRef.current.files[0].type.startsWith('image/')) {
        // @ts-ignore
        newMessage.image = URL.createObjectURL(fileInputRef.current.files[0])
      }
    }
    const newMessages = [...messages, newMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    setError(null)


    let apiResponse;
    let aiResponse ;

    try {
      if (selectedFeature === 'finAdvisor') {
      apiResponse = await fetch(`${backend_url}/LLM`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input })
      }).then(res => res.json())
      aiResponse = { role: 'assistant' as const, content: apiResponse.response }
    } 

    else if (selectedFeature === 'docQA' && fileInputRef.current?.files?.length) {
      const formData = new FormData();
      formData.append('file', fileInputRef.current.files[0]);

      apiResponse = await fetch(`${backend_url}/upload-pdf`, {
        method: 'POST',
        body: formData
      }).then(res => res.json())
      if (apiResponse.message == `Successfully processed ${fileInputRef.current.files[0].name}`) {
        aiResponse = { role: 'assistant' as const, content: `Successfully loaded ${fileInputRef.current.files[0].name}! You may now ask the AI your questions :)` }
      }
      setCollectionName(fileInputRef.current.files[0].name)
    }

    else if (selectedFeature === 'docQA' && !fileInputRef.current?.files?.length) {
      apiResponse = await fetch(`${backend_url}/query-chroma?query=${input}&collection_name=${collectionName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).then(res => res.json())
      aiResponse = { role: 'assistant' as const, content: apiResponse.llm_response }
    }

    else if (selectedFeature === 'chartQA' || selectedFeature === 'tableQA') {
      const formData = new FormData();
      console.log(input)
      console.log(fileInputRef.current?.files)
      formData.append('question', input);
      if (fileInputRef.current?.files?.length) {
        formData.append('image', fileInputRef.current.files[0]);
      }
      apiResponse = await fetch(`${backend_url}/table-chart-qa`, {
        method: 'POST',
        body: formData
      }).then(res => res.json());
      aiResponse = { role: 'assistant' as const, content: apiResponse.answer[0]}
    } 

    else if (selectedFeature === 'marketAnalyst') {
      apiResponse = await fetch(`${backend_url}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input })
      }).then(res => res.json())
      aiResponse = { role: 'assistant' as const, content: apiResponse.response}
    } 

    else if (selectedFeature === 'portfolioPlanner' && fileInputRef.current?.files?.length) {
      const formData = new FormData();
      formData.append('question', input);
      formData.append('file', fileInputRef.current.files[0]);
      apiResponse = await fetch(`${backend_url}/csv-query`, {
        method: 'POST',
        body: formData
      }).then(res => res.json())
      aiResponse = { role: 'assistant' as const, content: apiResponse.response}
    } 

    else {
      apiResponse = {
        content:  `There seems to be some issue. Please try again!`
      }
      aiResponse = { role: 'assistant' as const, content: apiResponse.content }
    }
    if (fileInputRef.current) fileInputRef.current.value = ''

    const updatedMessages = [...newMessages, aiResponse].filter(Boolean); 
    // @ts-ignore
    setMessages(updatedMessages)
    // @ts-ignore
    updateChatHistory(updatedMessages)
  }catch (error) {
    console.error('API Error:', error)
    setError('An error occurred while fetching the response. Please try again.')
    aiResponse = { role: 'assistant' as const, content: 'Sorry, I encountered an error. Please try again.' }
    const updatedMessages = [...newMessages, aiResponse]
    setMessages(updatedMessages)
    updateChatHistory(updatedMessages)
  } finally {
    setLoading(false)
  }

  }

  const updateChatHistory = (updatedMessages: typeof messages) => {
    if (currentChatId) {
      setChatHistory(prevHistory => 
        prevHistory.map(chat => 
          chat.id === currentChatId 
            ? { ...chat, messages: updatedMessages, title: updatedMessages[0]?.content.slice(0, 30) || 'New Chat' } 
            : chat
        )
      )
    } else {
      const newChatId = Date.now().toString()
      const newChat: ChatHistory = {
        id: newChatId,
        title: updatedMessages[0]?.content.slice(0, 30) || 'New Chat',
        messages: updatedMessages
      }
      setChatHistory(prevHistory => [...prevHistory, newChat])
      setCurrentChatId(newChatId)
    }
  }

  const startNewChat = () => {
    setCurrentChatId(null)
    setMessages([])
  }

  const selectChat = (chatId: string) => {
    setCurrentChatId(chatId)
  }

  const deleteChat = (chatId: string) => {
    setChatHistory(prevHistory => prevHistory.filter(chat => chat.id !== chatId))
    if (currentChatId === chatId) {
      startNewChat()
    }
  }

  const toggleLeftPane = () => {
    setIsLeftPaneVisible(!isLeftPaneVisible)
  }

  const ColoredFileIcon = ({ className }: { className?: string }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" fill="#E2E8F0" stroke="#4A5568" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 2V8H20" stroke="#4A5568" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
  
  const ColoredImageIcon = ({ className }: { className?: string }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="18" height="18" rx="2" fill="#BEE3F8" stroke="#3182CE" strokeWidth="2"/>
      <circle cx="8.5" cy="8.5" r="1.5" fill="#3182CE"/>
      <path d="M21 15L16 10L5 21" stroke="#3182CE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
  
  const ColoredSpreadsheetIcon = ({ className }: { className?: string }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="18" height="18" rx="2" fill="#FED7D7" stroke="#38A169" strokeWidth="2"/>
      <line x1="3" y1="9" x2="21" y2="9" stroke="#38A169" strokeWidth="2"/>
      <line x1="3" y1="15" x2="21" y2="15" stroke="#38A169" strokeWidth="2"/>
      <line x1="9" y1="21" x2="9" y2="3" stroke="#38A169" strokeWidth="2"/>
      <line x1="15" y1="21" x2="15" y2="3" stroke="#38A169" strokeWidth="2"/>
    </svg>
  )
  
  const ColoredPDFIcon = ({ className }: { className?: string }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" fill="#FEB2B2" stroke="#C53030" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 2V8H20" stroke="#C53030" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 13H8" stroke="#C53030" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 17H8" stroke="#C53030" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 9H9H8" stroke="#C53030" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <ColoredPDFIcon className="w-7 h-7 mr-2" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <ColoredImageIcon className="w-7 h-7 mr-2" />;
      case 'csv':
      case 'xlsx':
      case 'xls':
        return <ColoredSpreadsheetIcon className="w-7 h-7 mr-2" />;
      default:
        return <ColoredFileIcon className="w-7 h-7 mr-2" />;
    }
  };

  const startRecording = async () => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();  // Stop any existing recording
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);
  
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];  // Reset audio chunks for new recording
  
      // Capture audio chunks as they become available
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
  
      // When recording stops, process the audio blob
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);  // Set audio blob to state for later use
        console.log("Audio blob created:", audioBlob);
        await submitAudio(audioBlob);
      };
  
      // Start recording
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Unable to access microphone. Please check your permissions.');
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();  // This triggers onstop to create the blob
      setIsRecording(false);
      setIsPaused(false);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    audioStream?.getTracks().forEach(track => track.stop());
    setAudioStream(null); // Clear the stream from state
    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);
    setAudioBlob(null);
  };

  const togglePause = () => {
    if (mediaRecorderRef.current) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
      } else {
        mediaRecorderRef.current.pause();
      }
      setIsPaused(!isPaused);
    }
  };
  
  // Make sure the audioBlob is only submitted after `onstop` is triggered
  // @ts-ignore
  const submitAudio = async (audioBlob) => {
    if (!audioBlob) {
      console.log('No audio to submit');
      return;
    }
  
    console.log('Submitting audio:', audioBlob);
    setLoading(true);
    setError(null);
  
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.webm');
  
    try {
      const response = await fetch(`${backend_url}/transcribe`, {
        method: 'POST',
        body: formData,
      });
  
      if (!response.ok) {
        throw new Error('Transcription failed');
      }
  
      const data = await response.json();
      console.log("Transcription result:", data.text);
      setInput(data.text);
    } catch (error) {
      console.error('Transcription error:', error);
      setError('Failed to transcribe audio. Please try again.');
    } finally {
      setLoading(false);
      setAudioBlob(null);  // Clear the audio blob after submission
      setRecordingTime(0);
    }
  };
  

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="chat flex h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white mt-6">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        body {
          font-family: 'Inter', sans-serif;
        }

        @keyframes glow {
          0% { box-shadow: 0 0 5px #ff5722, 0 0 10px #ff5722, 0 0 15px #ff5722; }
          50% { box-shadow: 0 0 10px #ff5722, 0 0 20px #ff5722, 0 0 30px #ff5722; }
          100% { box-shadow: 0 0 5px #ff5722, 0 0 10px #ff5722, 0 0 15px #ff5722; }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }
        .glow-button {
          position: relative;
          overflow: hidden;
        }
        .glow-button.initial-load {
          animation: glow 3s;
        }
        .glow-button::after {
          content: "";
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.8) 10%, transparent 70%);
          opacity: 0;
        }
        .glow-button.initial-load::after {
          animation: sparkle 3s;
        }
        .expandable-textarea {
          min-height: 30px;
          max-height: 200px;
          resize: none;
          overflow-y: hidden;
        }
      `}</style>
      <div className={`transition-all duration-300 ease-in-out ${isLeftPaneVisible ? 'w-64' : 'w-0'} flex-shrink-0 overflow-hidden`}>
        <aside className="w-64 h-full bg-black bg-opacity-50 backdrop-blur-md p-4 flex flex-col">
        <Button 
            onClick={startNewChat} 
            className={`mb-4 bg-gradient-to-r from-[#ff5722] to-[#ff8a50] hover:from-[#e64a19] hover:to-[#ff7043] glow-button ${isInitialLoad ? 'initial-load' : ''}`}>
            <Plus className="w-4 h-4 mr-2" />
            New Chat
        </Button>
          <ScrollArea className="flex-grow">
            {chatHistory.map(chat => (
              <div key={chat.id} className="mb-2 flex items-center">
                <Button
                  variant="ghost"
                  className={`flex-grow justify-start truncate ${currentChatId === chat.id ? 'bg-white bg-opacity-10' : ''}`}
                  onClick={() => selectChat(chat.id)}
                >
                  <span className="truncate">{chat.title}</span>
                </Button>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="flex-shrink-0 ml-2 w-8 h-8"
                        onClick={() => deleteChat(chat.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Delete chat</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            ))}
          </ScrollArea>
        </aside>
      </div>
      <div className="flex flex-col flex-grow ml-4">
        <header className="flex items-center justify-between p-4 bg-black bg-opacity-50 backdrop-blur-md rounded-lg mb-4">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={toggleLeftPane}>
              {isLeftPaneVisible ? <ChevronLeft /> : <ChevronRight />}
            </Button>
            <div className="w-8 h-8 bg-gradient-to-br from-[#ff5722] to-[#ff8a50] rounded-md"></div>
            <span className="text-xl font-bold">{selectedFeature}</span>
          </div>
          <nav className="hidden md:flex space-x-4">
            <Combobox onValueChange={(value) => setSelectedFeature(value)}/>
            <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5" />
            </Button>
          </nav>
        </header>
        <main className="p-4 overflow-auto bg-black bg-opacity-50 backdrop-blur-md rounded-lg mb-4">
          <ScrollArea className="h-96 pr-4">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-3xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 my-10">
                  What would you like to know?
                </p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`mb-4 ${
                    message.role === 'user' ? 'text-right' : 'text-left'
                  }`}
                >
                  <div
                    className={`inline-block p-4 rounded-2xl max-w-[80%] ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-[#ff5722] to-[#ff8a50] text-white'
                        : 'bg-white bg-opacity-10 text-white'
                    }`}
                  >
                    {message.image && (
                      <div className="mb-2">
                        <Image
                          src={message.image}
                          alt="Uploaded image"
                          width={300}
                          height={200}
                          className="rounded-lg"
                        />
                      </div>
                    )}
                    {message.file && (
                      <div className="mb-2 text-sm opacity-75 flex items-center">
                        {getFileIcon(message.file)}
                        Attached file: {message.file}
                      </div>
                    )}
                    {message.role === 'user' ? (
                      <div>{message.content}</div>
                    ) : (
                      <Markdown className="markdown">{message.content}</Markdown>
                    )}
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex items-center justify-center space-x-2 text-white">
                <Loader2 className="h-4 w-4 animate-spin" />
                <p>Thinking...</p>
              </div>
            )}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </ScrollArea>
        </main>
        <div className="p-4 bg-black bg-opacity-50 backdrop-blur-md rounded-lg">
        {isRecording ? (
              <div className="flex flex-col items-center space-y-4">
                {/* <div className="text-2xl font-bold">{formatTime(recordingTime)}</div> */}
                <div className="waveform w-full">
                {isRecording && (
                  <p className='text-xl font-bold text-[#ff5722] text-center animate-pulse'>Recording.......</p>
                )}
                </div>
                <div className="flex space-x-4">
                  <Button
                    onClick={cancelRecording}
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={togglePause}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    {isPaused ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
                    {isPaused ? 'Resume' : 'Pause'}
                  </Button>
                    <Button
                    onClick={stopRecording}
                    className="bg-green-500 hover:bg-green-600 text-white"
                    >
                    <Check className="w-4 h-4 mr-2" />
                    Done
                    </Button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSend()
                }}
                className="flex space-x-2"
              >
                <div className="flex-grow relative">
                  <textarea
                    ref={textareaRef}
                    placeholder="Ask about financial insights..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="w-full bg-white bg-opacity-10 text-white border-[#ff5722] focus:ring-[#ff5722] rounded-2xl py-6 px-3 pr-24 expandable-textarea"
                    style={{ paddingRight: '6rem' }}
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-transparent border-none hover:bg-white hover:bg-opacity-10"
                            disabled={selectedFeature === 'marketAnalyst' || selectedFeature === 'finAdvisor'}
                          >
                            <Upload className="w-4 h-4" />
                            <span className="sr-only">Upload file</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Upload file</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={startRecording}
                            className="bg-transparent border-none hover:bg-white hover:bg-opacity-10"
                          >
                            <Mic className="w-4 h-4" />
                            <span className="sr-only">Start recording</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Start recording</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={() => handleSend()}
                />
                <Button 
                  type="submit" 
                  className={`bg-gradient-to-r from-[#ff5722] to-[#ff8a50] hover:from-[#e64a19] hover:to-[#ff7043] rounded-2xl glow-button mt-5 h-10 ${isInitialLoad ? 'initial-load' : ''}`}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span className="sr-only">Send</span>
                </Button>
              </form>
            )}
        </div>
      </div>
    </div>
  )
}
