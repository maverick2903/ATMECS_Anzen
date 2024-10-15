"use client"

import { useState } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import styles from './info.module.css'
import { useSwipeable } from 'react-swipeable'
import YouTube, { YouTubeProps } from 'react-youtube';
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogFooter  } from '@/components/ui/dialog'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import Markdown from 'react-markdown'

interface NewsItem {
  uuid: string;
  title: string;
  publisher: string;
  link: string;
  providerPublishTime: number;
  type: string;
  thumbnail: {
    resolutions: {
      url: string;
      width: number;
      height: number;
      tag: string;
    }[];
  };
  relatedTickers?: string[];
}

interface YoutubeVideo {
  youtube: string;
}

export default function StockInfo() {
  const backend_url = "https://de7a-35-231-183-6.ngrok-free.app"
  const [summary, setSummary] = useState("");
  const [ticker, setTicker] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const [newsData, setNewsData] = useState<NewsItem[]>([]);
  const [youtubeData, setYoutubeData] = useState<YoutubeVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setShowInfo(false);
    setNewsData([]);
    setYoutubeData([]);

    try {
      const responseNews = await fetch(`${backend_url}/crawl-news?ticker=${ticker}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!responseNews.ok) {
        throw new Error(`Failed to fetch news: ${responseNews.statusText}`);
      }

      const dataNews = await responseNews.json();
      setNewsData(dataNews.news);

      const responseYoutube = await fetch(`${backend_url}/web-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: `${ticker} stock` }),
      });

      if (!responseYoutube.ok) {
        throw new Error(`Failed to fetch YouTube data: ${responseYoutube.statusText}`);
      }

      const dataYoutube = await responseYoutube.json();
      setYoutubeData(dataYoutube.youtube);

      setShowInfo(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      console.log('swiped left');
      setCurrentIndex(prev => (prev + 4) % newsData.length);
    },
    onSwipedRight: () => setCurrentIndex(prev => (prev - 1 + newsData.length) % newsData.length),
    trackMouse: true
  });

  const onPlayerReady: YouTubeProps['onReady'] = (event) => {
    event.target.pauseVideo();
  }

  const opts: YouTubeProps['opts'] = {
    height: '170',
    width: '300',
    playerVars: {
      autoplay: 0,
    },
  };

  const fetchSummary = async (input: string) => {
    const prompt = `Summarize the news article titled: ${input}`;
    setLoading(true);
    setSummary("");
    try {
      const apiResponse = await fetch(`${backend_url}/LLM`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: prompt })
      });

      if (!apiResponse.ok) {
        throw new Error(`Failed to fetch summary: ${apiResponse.statusText}`);
      }

      const data = await apiResponse.json();
      setSummary(data.response);
    } catch (err) {
      setSummary("Error fetching summary. Please try again later.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen text-white p-8 bg-gradient-to-br from-black via-gray-800 to-black">
      <div className="max-w-6xl mx-auto backdrop-blur-sm bg-black/70 rounded-xl p-8 shadow-2xl">
        {!showInfo ? (
          <div className="max-w-md mx-auto text-center">
            <h1 className="text-4xl font-bold text-center mb-8">
              <span className="text-transparent px-2 bg-gradient-to-r from-[#D247BF] to-primary bg-clip-text">
                Anzen
              </span>
              Stock Information
            </h1>
            <h2 className="text-2xl mb-4 my-40">What would you like to fetch info about?</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="text"
                placeholder="Enter stock ticker"
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
              <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" disabled={loading}>
                {loading ? 'Fetching...' : 'Fetch Info'}
              </Button>
            </form>
            {loading && (
              <div className="flex flex-col items-center space-y-4 my-3">
                <div className="animate-spin rounded-full border-4 border-gray-300 border-t-gray-900 h-12 w-12" />
                <p className="text-gray-500 dark:text-gray-400">Loading...</p>
              </div>
            )}
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            <h2 className="text-4xl font-bold text-center mb-6 relative overflow-hidden py-2">
              <span className="relative z-10 inline-block animate-pulse">
                <span className="text-transparent bg-gradient-to-r from-[#D247BF] to-primary bg-clip-text">
                  {ticker}
                </span>
              </span>
              <span className="relative z-10 ml-2">Information</span>
            </h2>

            <div>
              <h3 className="text-2xl mb-4">Latest News</h3>
              {newsData.length > 0 ? (
                <div className={styles.scrollContainer} {...handlers}>
                  <div className={styles.scrollContent}>
                    {newsData.map((item, index) => (
                      <Card key={`${item.uuid}-${index}`} className={`${styles.newsCard} bg-gray-800 flex flex-col`}>
                        <CardContent className="p-4 flex flex-col h-full">
                          <img 
                            src={item.thumbnail?.resolutions?.find(res => res.tag === "140x140")?.url || "/placeholder.svg?height=140&width=140"} 
                            alt={item.title} 
                            className="w-full h-32 object-cover mb-2 rounded" 
                          />
                          <h4 className="font-semibold mb-2">{item.title}</h4>
                          <p className="text-sm text-gray-400 mb-2">{item.publisher}</p>
                      
                          <div className="flex justify-between items-center mt-auto">
                            <a href={item.link} target="_blank" className="text-orange-500 hover:underline text-sm">Read more</a>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button onClick={() => fetchSummary(item.title)} className="bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded">
                                  Get AI Summary
                                </Button>
                              </DialogTrigger>
                              
                              <DialogContent>
                                <DialogTitle>AI Summary</DialogTitle>
                                <DialogDescription>
                                  {loading ? "Fetching summary..." : <Markdown>{summary}</Markdown>}
                                </DialogDescription>
                                <DialogFooter>
                                  <Button variant="secondary" onClick={() => setSummary("")}>Close</Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No News</AlertTitle>
                  <AlertDescription>No news articles found for this stock ticker.</AlertDescription>
                </Alert>
              )}
            </div>
            
            <div>
              <h3 className="text-2xl mb-4">Related Videos</h3>
              {youtubeData.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {youtubeData.map((videoId, index) => (
                    <div 
                      key={index} 
                      className="relative overflow-hidden rounded-lg shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                    >
                      <YouTube 
                        videoId={videoId} 
                        opts={opts} 
                        onReady={onPlayerReady}
                        className="w-full h-48 sm:h-64 md:h-40 lg:h-56"
                      />

                      <div className="absolute inset-0 bg-black bg-opacity-25 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <a 
                          href={`https://www.youtube.com/watch?v=${videoId}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-white font-semibold bg-orange-500 hover:bg-orange-600 px-4 py-2 mr-7 rounded"
                        >
                          Watch on YouTube
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No Videos</AlertTitle>
                  <AlertDescription>No related videos found for this stock ticker.</AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}