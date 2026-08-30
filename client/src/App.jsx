import React, { useEffect, useState } from 'react'

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

export default function App(){
  const [msg, setMsg] = useState('loading...')
  useEffect(()=>{
    fetch(API + '/api/ping')
      .then(r=>r.json())
      .then(d=>setMsg(JSON.stringify(d)))
      .catch(e=>setMsg('error: '+e.message))
  },[])
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="p-6 bg-white rounded shadow">
        <h1 className="text-xl font-bold mb-2">Client</h1>
        <div>API ping: {msg}</div>
      </div>
    </div>
  )
}
