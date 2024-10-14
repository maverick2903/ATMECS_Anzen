"use client"

import { useState, useEffect, useRef } from 'react'
import { Send, Plus, Trash2, Upload, ChevronLeft, ChevronRight, Settings } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Combobox } from '@/components/ui/combobox'
import Markdown from 'react-markdown'
import { set } from 'react-hook-form'

type ChatHistory = {
  id: string;
  title: string;
  messages: { role: 'user' | 'assistant'; content: string; file?: string }[];
}

export default function Component() {
  const backend_url = "https://6b96-35-227-172-243.ngrok-free.app"

  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string; file?: string }[]>([])
  const [input, setInput] = useState('')
  const [isLeftPaneVisible, setIsLeftPaneVisible] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null)
  const [collectionName, setCollectionName] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)


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
      newMessage.file = fileInputRef.current.files[0].name
    }
    const newMessages = [...messages, newMessage]
    setMessages(newMessages)
    setInput('')


    let apiResponse;
    let aiResponse ;

    if (selectedFeature === 'finAdvisor') {
      setLoading(true)
      console.log(loading)
      apiResponse = await fetch(`${backend_url}/LLM`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input })
      }).then(res => res.json())
      aiResponse = { role: 'assistant' as const, content: apiResponse.response }
      setLoading(false)
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
      setLoading(false)
    }

    else if (selectedFeature === 'docQA' && !fileInputRef.current?.files?.length) {
      setLoading(true)
      apiResponse = await fetch(`${backend_url}/query-chroma?query=${input}&collection_name=${collectionName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).then(res => res.json())
      aiResponse = { role: 'assistant' as const, content: apiResponse.llm_response }
      setLoading(false)
    }

    else if (selectedFeature === 'chartQA' || selectedFeature === 'tableQA') {
      setLoading(true)
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
      setLoading(false)
    } 

    else if (selectedFeature === 'marketAnalyst') {
      setLoading(true)
      apiResponse = await fetch(`${backend_url}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input })
      }).then(res => res.json())
      aiResponse = { role: 'assistant' as const, content: apiResponse.response}
      setLoading(false)
    } 

    else if (selectedFeature === 'portfolioPlanner' && fileInputRef.current?.files?.length) {
      setLoading(true)
      const formData = new FormData();
      formData.append('question', input);
      formData.append('file', fileInputRef.current.files[0]);
      apiResponse = await fetch(`${backend_url}/csv-query`, {
        method: 'POST',
        body: formData
      }).then(res => res.json())
      aiResponse = { role: 'assistant' as const, content: apiResponse.response}
      setLoading(false)
    } 

    else {
      apiResponse = {
        content:  `There seems to be some issue. Please try again!`
      }
      aiResponse = { role: 'assistant' as const, content: apiResponse.content }
      setLoading(false)
    }

    if (fileInputRef.current) fileInputRef.current.value = ''

    const updatedMessages = [...newMessages, aiResponse]
    setMessages(updatedMessages)
    updateChatHistory(updatedMessages)
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
    setMessages([{ role: 'assistant', content: 'Hello! How can I assist you with financial insights today?' }])
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

  return (
    <div className="chat flex h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white font-sans mt-6">
<style jsx global>{`
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
      <div className={`transition-all duration-300 ease-in-out ${isLeftPaneVisible ? 'w-64' : 'w-0'} overflow-hidden`}>
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
                  className={`w-full justify-start truncate ${currentChatId === chat.id ? 'bg-white bg-opacity-10' : ''}`}
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
                        className="ml-2"
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
                    {message.file && (
                      <div className="mb-2 text-sm opacity-75">
                        Attached file: {message.file}
                      </div>
                    )}
                    {message.role === 'user' ? (
                      <div>{message.content}</div>
                      // Display user messages as plain text
                      
                    ) : (
                      <Markdown className="markdown">{message.content}</Markdown>
                    )}
                  </div>
                </div>
              ))
            )}
          </ScrollArea>
        </main>
        <div className="p-4 bg-black bg-opacity-50 backdrop-blur-md rounded-lg">
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
                className="w-full bg-white bg-opacity-10 text-white border-[#ff5722] focus:ring-[#ff5722] rounded-2xl py-6 px-3 pr-12 expandable-textarea"
                style={{ paddingRight: '3rem' }}
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-transparent border-none hover:bg-white hover:bg-opacity-10"
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
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={() => handleSend()}
            />
            <Button type="submit" className={`bg-gradient-to-r from-[#ff5722] to-[#ff8a50] hover:from-[#e64a19] hover:to-[#ff7043] rounded-2xl glow-button mt-5 h-10  ${isInitialLoad ? 'initial-load' : ''}`}
              >
                <Send className="w-4 h-4" />
                <span className="sr-only">Send</span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}