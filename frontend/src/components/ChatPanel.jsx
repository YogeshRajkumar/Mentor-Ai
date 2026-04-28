import React, { useEffect, useMemo, useRef, useState } from "react";

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="h-3.5 w-2/3 rounded bg-gray-200" />
        <div className="h-5 w-16 shrink-0 rounded-full bg-gray-200" />
      </div>
      <div className="mt-2 h-3 w-1/3 rounded bg-gray-100" />
    </div>
  );
}

function ChatPanel({ messages, onSendMessage, isTyping, isOffline }) {
  const [input, setInput] = useState("");
  const chatEndRef        = useRef(null);
  const inputRef          = useRef(null);
  const debounceRef       = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const dispatchMessage = (text) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSendMessage(text);
    }, 300);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || isTyping || isOffline) return;
    setInput("");
    dispatchMessage(text);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      const text = input.trim();
      if (!text || isTyping || isOffline) return;
      setInput("");
      dispatchMessage(text);
    }
  };

  const canSend = !!input.trim() && !isTyping && !isOffline;

  const sortedMessages = useMemo(() => messages, [messages]);

  return (
    <aside className="hidden w-[380px] border-l border-gray-200 bg-white xl:flex xl:flex-col h-full">
      <div className="border-b border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-800">Chat with AI Mentor</h3>
        <p className="text-xs text-gray-500">
          Personalized guidance
        </p>
        {isOffline && (
          <p className="mt-1 text-xs font-medium text-red-500">
            ⚠ You're offline
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        {sortedMessages.map((message, idx) => {
          const prevRole = idx > 0 ? sortedMessages[idx - 1].role : null;
          const isGrouped = prevRole === message.role;

          return (
            <div
              key={message.id}
              className={`flex flex-col ${
                message.role === "user" ? "items-end" : "items-start"
              } ${isGrouped ? "mt-1" : "mt-4"}`}
            >
              {!isGrouped && (
                <span className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  {message.role === "user" ? "You" : "AI Mentor"}
                </span>
              )}
              
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                  message.role === "user"
                    ? "bg-indigo-600 text-white rounded-tr-none shadow-indigo-100"
                    : "bg-gray-200/60 text-gray-800 rounded-tl-none border border-gray-300/40"
                } leading-relaxed transition-all duration-300 hover:shadow-md`}
              >
                <div className="font-medium">
                  {message.text}
                </div>

                {message.structuredData && (
                  <div className={`mt-3 space-y-4 border-t pt-3 ${
                    message.role === "user" ? "border-white/20" : "border-gray-200"
                  }`}>
                    {/* PLACEMENT TYPE */}
                    {message.type === "placement" && (
                      <>
                        {message.structuredData?.insight && (
                          <div className="rounded-xl bg-blue-50 p-3 text-[12px] text-blue-900 border border-blue-200 font-medium">
                            <span className="font-bold block mb-1 uppercase tracking-tighter text-[10px] text-blue-700">💡 Insight</span>
                            {message.structuredData.insight}
                          </div>
                        )}
                        
                        <div className="grid grid-cols-1 gap-2">
                          {message.structuredData?.technical?.length > 0 && (
                            <div className="bg-gray-50/50 p-2 rounded-lg border border-gray-100">
                              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Technical</span>
                              <ul className="mt-1 space-y-0.5">
                                {message.structuredData.technical.map((item, i) => (
                                  <li key={i} className="text-[12px] text-gray-700 flex items-center gap-1.5 font-medium">
                                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {message.structuredData?.strategy?.length > 0 && (
                            <div className="bg-green-50/30 p-2 rounded-lg border border-green-100">
                              <span className="text-[9px] font-bold text-green-700 uppercase tracking-widest">Strategy</span>
                              <ul className="mt-1 space-y-0.5">
                                {message.structuredData.strategy.map((item, i) => (
                                  <li key={i} className="text-[12px] text-gray-700 flex items-center gap-1.5 font-medium">
                                    <span className="text-green-600 font-bold text-sm">✓</span>
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {message.structuredData?.tips?.length > 0 && (
                            <div className="bg-amber-50/30 p-2 rounded-lg border border-amber-100">
                              <span className="text-[9px] font-bold text-amber-700 uppercase tracking-widest">Expert Tips</span>
                              <ul className="mt-1 space-y-0.5">
                                {message.structuredData.tips.map((item, i) => (
                                  <li key={i} className="text-[12px] text-gray-700 flex items-center gap-1.5 italic font-medium">
                                    <span className="text-amber-500 font-bold">★</span>
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* GUIDANCE / APTITUDE TYPE */}
                    {(message.type === "guidance" || message.type === "aptitude") && message.structuredData?.steps && (
                      <div className="space-y-2">
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Recommended Steps</span>
                        {message.structuredData.steps.map((step, i) => (
                          <div key={i} className="flex items-start gap-2 bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                            <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">{i + 1}</span>
                            <span className="text-[12px] text-gray-700 font-medium">{step}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* UNRELATED TYPE */}
                    {message.type === "unrelated" && (
                      <div className="rounded-xl bg-red-50 p-3 text-[12px] text-red-900 border border-red-100 flex items-center gap-3 font-medium">
                        <span className="text-xl">🛡️</span>
                        <span>I only provide assistance for placement and career-related queries.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl bg-gray-100 px-4 py-3">
              <span className="flex gap-1">
                <span className="h- w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
              </span>
              <span className="text-xs text-gray-500">
                AI is thinking...
              </span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      <div className="border-t border-gray-200 p-2 bg-white">
  <div className="flex items-center gap-2 rounded-full border border-gray-300 px-3 py-1.5 bg-gray-50 focus-within:ring-2 focus-within:ring-indigo-400">

    <textarea
      rows={1}
      placeholder={isOffline ? "You're offline…" : "Ask AI Mentor..."}
      value={input}
      onChange={(e) => setInput(e.target.value)}
      className="flex-1 resize-none outline-none text-sm bg-transparent overflow-hidden leading-tight"
      onInput={(e) => {
        e.target.style.height = "auto";
        e.target.style.height = e.target.scrollHeight + "px";
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleSubmit(e);
        }
      }}
      disabled={isTyping || isOffline}
    />

    <button
  onClick={handleSubmit}
  disabled={!canSend}
  className="flex items-center justify-center w-9 h-9 rounded-full bg-indigo-500 hover:bg-indigo-600 active:scale-95 transition disabled:opacity-50"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="w-6 h-6 text-white pl-1"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M2 21l20-9L2 3v7l14 2-14 2z" />
  </svg>
</button>

  </div>
</div>
    </aside>
  );
}

export { SkeletonCard };
export default React.memo(ChatPanel);