'use client';

import { useState, useEffect } from 'react';

export default function MobileDebugger({ enabled = true }) {
  const [isVisible, setIsVisible] = useState(false);
  const [logs, setLogs] = useState([]);
  const [apiCalls, setApiCalls] = useState([]);
  const [userAgent, setUserAgent] = useState('');
  const [screenInfo, setScreenInfo] = useState({});
  const [networkInfo, setNetworkInfo] = useState({});
  const [storageData, setStorageData] = useState({});
  const [currentRoute, setCurrentRoute] = useState('');

  useEffect(() => {
    if (!enabled) return;
    
    // Capture user agent
    setUserAgent(navigator.userAgent);
    
    // Capture screen info
    setScreenInfo({
      width: window.innerWidth,
      height: window.innerHeight,
      pixelRatio: window.devicePixelRatio,
      orientation: window.screen.orientation?.type || 'N/A'
    });
    
    // Capture network info
    setNetworkInfo({
      online: navigator.onLine,
      type: navigator.connection?.effectiveType || 'N/A',
      downlink: navigator.connection?.downlink || 'N/A'
    });
    
    // Capture localStorage
    try {
      const storage = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        storage[key] = localStorage.getItem(key);
      }
      setStorageData(storage);
    } catch (e) {
      setStorageData({ error: e.message });
    }
    
    // Capture current route
    setCurrentRoute(window.location.pathname);
    
    // Intercepter les changements de route
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    
    window.history.pushState = function() {
      originalPushState.apply(this, arguments);
      setCurrentRoute(window.location.pathname);
      console.log(`Route changée: ${window.location.pathname}`);
    };
    
    window.history.replaceState = function() {
      originalReplaceState.apply(this, arguments);
      setCurrentRoute(window.location.pathname);
      console.log(`Route remplacée: ${window.location.pathname}`);
    };
    
    // Écouter les événements popstate (navigation arrière/avant)
    const handlePopState = () => {
      setCurrentRoute(window.location.pathname);
      console.log(`Navigation: ${window.location.pathname}`);
    };
    
    window.addEventListener('popstate', handlePopState);
    
    // Override console methods to capture logs
    const originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info
    };
    
    console.log = function(...args) {
      setLogs(prev => [...prev, { type: 'log', content: args.map(arg => formatArg(arg)).join(' '), time: new Date() }]);
      originalConsole.log(...args);
    };
    
    console.error = function(...args) {
      setLogs(prev => [...prev, { type: 'error', content: args.map(arg => formatArg(arg)).join(' '), time: new Date() }]);
      originalConsole.error(...args);
    };
    
    console.warn = function(...args) {
      setLogs(prev => [...prev, { type: 'warn', content: args.map(arg => formatArg(arg)).join(' '), time: new Date() }]);
      originalConsole.warn(...args);
    };
    
    console.info = function(...args) {
      setLogs(prev => [...prev, { type: 'info', content: args.map(arg => formatArg(arg)).join(' '), time: new Date() }]);
      originalConsole.info(...args);
    };
    
    // Intercepter les requêtes fetch et axios
    const originalFetch = window.fetch;
    window.fetch = async function(url, options = {}) {
      const startTime = new Date();
      const method = options.method || 'GET';
      const requestId = Math.random().toString(36).substring(2, 9);
      
      console.log(`API Request (${requestId}): ${method} ${url}`);
      setApiCalls(prev => [...prev, {
        id: requestId,
        url,
        method,
        startTime,
        status: 'pending',
        requestData: options.body ? JSON.parse(options.body) : null
      }]);
      
      try {
        const response = await originalFetch(url, options);
        const endTime = new Date();
        const duration = endTime - startTime;
        
        // Cloner la réponse pour pouvoir la lire
        const clonedResponse = response.clone();
        let responseData;
        try {
          responseData = await clonedResponse.json();
        } catch (e) {
          responseData = await clonedResponse.text();
        }
        
        console.log(`API Response (${requestId}): ${response.status} ${response.statusText} (${duration}ms)`);
        setApiCalls(prev => prev.map(call => 
          call.id === requestId ? {
            ...call,
            status: 'completed',
            statusCode: response.status,
            duration,
            responseData
          } : call
        ));
        
        return response;
      } catch (error) {
        const endTime = new Date();
        const duration = endTime - startTime;
        
        console.error(`API Error (${requestId}): ${error.message} (${duration}ms)`);
        setApiCalls(prev => prev.map(call => 
          call.id === requestId ? {
            ...call,
            status: 'error',
            duration,
            error: error.message
          } : call
        ));
        
        throw error;
      }
    };
    
    // Intercepter les requêtes XMLHttpRequest pour les appels qui n'utilisent pas fetch
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.open = function(method, url) {
      this._debugMethod = method;
      this._debugUrl = url;
      this._debugRequestId = Math.random().toString(36).substring(2, 9);
      return originalXHROpen.apply(this, arguments);
    };
    
    XMLHttpRequest.prototype.send = function(data) {
      const startTime = new Date();
      const requestId = this._debugRequestId;
      const method = this._debugMethod;
      const url = this._debugUrl;
      
      console.log(`XHR Request (${requestId}): ${method} ${url}`);
      setApiCalls(prev => [...prev, {
        id: requestId,
        url,
        method,
        startTime,
        status: 'pending',
        requestData: data ? JSON.parse(data) : null
      }]);
      
      this.addEventListener('load', function() {
        const endTime = new Date();
        const duration = endTime - startTime;
        let responseData;
        
        try {
          responseData = JSON.parse(this.responseText);
        } catch (e) {
          responseData = this.responseText;
        }
        
        console.log(`XHR Response (${requestId}): ${this.status} (${duration}ms)`);
        setApiCalls(prev => prev.map(call => 
          call.id === requestId ? {
            ...call,
            status: 'completed',
            statusCode: this.status,
            duration,
            responseData
          } : call
        ));
      });
      
      this.addEventListener('error', function(error) {
        const endTime = new Date();
        const duration = endTime - startTime;
        
        console.error(`XHR Error (${requestId}): ${error} (${duration}ms)`);
        setApiCalls(prev => prev.map(call => 
          call.id === requestId ? {
            ...call,
            status: 'error',
            duration,
            error: 'Network Error'
          } : call
        ));
      });
      
      return originalXHRSend.apply(this, arguments);
    };
    
    // Restore original methods on cleanup
    return () => {
      console.log = originalConsole.log;
      console.error = originalConsole.error;
      console.warn = originalConsole.warn;
      console.info = originalConsole.info;
      window.fetch = originalFetch;
      XMLHttpRequest.prototype.open = originalXHROpen;
      XMLHttpRequest.prototype.send = originalXHRSend;
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener('popstate', handlePopState);
    };
  }, [enabled]);
  
  // Format arguments for display
  const formatArg = (arg) => {
    if (arg === null) return 'null';
    if (arg === undefined) return 'undefined';
    if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg);
      } catch (e) {
        return Object.prototype.toString.call(arg);
      }
    }
    return String(arg);
  };
  
  // Clear logs and API calls
  const clearLogs = () => {
    setLogs([]);
    setApiCalls([]);
  };
  
  if (!enabled) return null;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <button 
        onClick={() => setIsVisible(!isVisible)}
        className="absolute bottom-4 right-4 bg-gray-800 text-white p-2 rounded-full shadow-lg"
      >
        {isVisible ? 'X' : 'Debug'}
      </button>
      
      {isVisible && (
        <div className="bg-gray-900 text-white p-4 max-h-[80vh] overflow-auto">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-bold">Mobile Debugger</h3>
            <button 
              onClick={clearLogs}
              className="bg-red-600 text-white px-2 py-1 text-xs rounded"
            >
              Clear Logs
            </button>
          </div>
          
          <div className="mb-4">
            <h4 className="font-bold border-b border-gray-700 pb-1 mb-2">Device & Route Info</h4>
            <div className="text-xs">
              <p><span className="text-gray-400">Current Route:</span> <span className="text-green-400">{currentRoute}</span></p>
              <p><span className="text-gray-400">User Agent:</span> {userAgent}</p>
              <p><span className="text-gray-400">Screen:</span> {screenInfo.width}x{screenInfo.height} (Ratio: {screenInfo.pixelRatio})</p>
              <p><span className="text-gray-400">Orientation:</span> {screenInfo.orientation}</p>
              <p><span className="text-gray-400">Network:</span> {networkInfo.online ? 'Online' : 'Offline'} ({networkInfo.type}, {networkInfo.downlink}Mbps)</p>
            </div>
          </div>
          
          <div className="mb-4">
            <h4 className="font-bold border-b border-gray-700 pb-1 mb-2">Local Storage</h4>
            <div className="text-xs">
              {Object.entries(storageData).map(([key, value]) => (
                <p key={key}><span className="text-gray-400">{key}:</span> {value}</p>
              ))}
            </div>
          </div>
          
          <div className="mb-4">
            <h4 className="font-bold border-b border-gray-700 pb-1 mb-2">API Calls</h4>
            <div className="text-xs space-y-2">
              {apiCalls.length === 0 ? (
                <p className="text-gray-500 italic">No API calls yet</p>
              ) : (
                apiCalls.slice().reverse().map((call, index) => (
                  <div 
                    key={index} 
                    className={`p-2 rounded border-l-4 ${
                      call.status === 'error' ? 'bg-red-900/30 border-red-500' : 
                      call.status === 'completed' ? 
                        (call.statusCode >= 200 && call.statusCode < 300 ? 'bg-green-900/30 border-green-500' : 'bg-yellow-900/30 border-yellow-500') : 
                      'bg-blue-900/30 border-blue-500'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-medium">{call.method} {call.url.split('?')[0]}</span>
                      <span className="text-xs">
                        {call.status === 'pending' ? '...' : 
                         call.status === 'error' ? 'ERROR' : 
                         `${call.statusCode} (${call.duration}ms)`}
                      </span>
                    </div>
                    
                    {call.requestData && (
                      <div className="mt-1">
                        <span className="text-gray-400">Request:</span>
                        <pre className="mt-1 p-1 bg-black/30 rounded overflow-x-auto">{
                          typeof call.requestData === 'string' ? call.requestData : JSON.stringify(call.requestData, null, 2)
                        }</pre>
                      </div>
                    )}
                    
                    {call.responseData && (
                      <div className="mt-1">
                        <span className="text-gray-400">Response:</span>
                        <pre className="mt-1 p-1 bg-black/30 rounded overflow-x-auto">{
                          typeof call.responseData === 'string' ? 
                            (call.responseData.length > 200 ? call.responseData.substring(0, 200) + '...' : call.responseData) : 
                            JSON.stringify(call.responseData, null, 2)
                        }</pre>
                      </div>
                    )}
                    
                    {call.error && (
                      <div className="mt-1 text-red-400">
                        <span>Error: {call.error}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div>
            <h4 className="font-bold border-b border-gray-700 pb-1 mb-2">Console Logs</h4>
            <div className="text-xs space-y-1">
              {logs.length === 0 ? (
                <p className="text-gray-500 italic">No logs yet</p>
              ) : (
                logs.slice().reverse().map((log, index) => (
                  <div 
                    key={index} 
                    className={`p-1 rounded ${log.type === 'error' ? 'bg-red-900/50' : 
                      log.type === 'warn' ? 'bg-yellow-900/50' : 
                      log.type === 'info' ? 'bg-blue-900/50' : 'bg-gray-800/50'}`}
                  >
                    <span className="text-gray-400 mr-1">[{log.time.toLocaleTimeString()}]</span>
                    <span>{log.content}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
