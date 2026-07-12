'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, Calendar } from 'lucide-react';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** Structured date + shichen from the wheel picker */
export interface DateSelection {
  year: number;
  month: number;
  day: number;
  /** 0-11 index: 0=子时, 1=丑时, ... 11=亥时 */
  shichenIndex: number;
}

interface FortuneChatProps {
  systemPrompt: string;
  onMessagesChange?: (messages: ChatMessage[]) => void;
  placeholder?: string;
  initialMessages?: ChatMessage[];
  /** Called when user clicks the "info collected" action, receives latest messages */
  onInfoCollected?: (messages: ChatMessage[]) => void;
  /** Whether to show the "info collected" button */
  showCollectButton?: boolean;
  /** Whether to show the date picker wheel */
  showDatePicker?: boolean;
  /** Called with structured date data when user confirms the wheel picker */
  onDateSelected?: (date: DateSelection) => void;
}

/* ── Date Picker Wheel ── */
const YEAR_RANGE = Array.from({ length: 100 }, (_, i) => 1940 + i);
const MONTH_RANGE = Array.from({ length: 12 }, (_, i) => i + 1);
const DAY_RANGE = Array.from({ length: 31 }, (_, i) => i + 1);
const SHICHEN_LABELS = [
  '子时(23-1点)', '丑时(1-3点)', '寅时(3-5点)', '卯时(5-7点)',
  '辰时(7-9点)', '巳时(9-11点)', '午时(11-13点)', '未时(13-15点)',
  '申时(15-17点)', '酉时(17-19点)', '戌时(19-21点)', '亥时(21-23点)',
];

/** Map shichenIndex (0-11) to representative hour for lunar-javascript */
export const SHICHEN_TO_HOUR = [0, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21];

function DatePickerWheel({
  onConfirm,
}: {
  onConfirm: (dateStr: string, dateData: DateSelection) => void;
}) {
  const [year, setYear] = useState(1990);
  const [month, setMonth] = useState(1);
  const [day, setDay] = useState(1);
  const [shichen, setShichen] = useState(6);
  const yearRef = useRef<HTMLDivElement>(null);
  const monthRef = useRef<HTMLDivElement>(null);
  const dayRef = useRef<HTMLDivElement>(null);
  const shichenRef = useRef<HTMLDivElement>(null);

  const scrollToItem = (ref: React.RefObject<HTMLDivElement | null>, index: number) => {
    if (ref.current) {
      const itemHeight = 36;
      ref.current.scrollTop = index * itemHeight;
    }
  };

  useEffect(() => {
    scrollToItem(yearRef, year - 1940);
    scrollToItem(monthRef, month - 1);
    scrollToItem(dayRef, day - 1);
    scrollToItem(shichenRef, shichen);
  }, []);

  const handleConfirm = () => {
    const dateStr = `${year}年${month}月${day}日 ${SHICHEN_LABELS[shichen]}`;
    onConfirm(dateStr, { year, month, day, shichenIndex: shichen });
  };

  const renderItem = (
    ref: React.RefObject<HTMLDivElement | null>,
    items: { value: number; label: string }[],
    selectedValue: number,
    onChange: (v: number) => void,
  ) => (
    <div
      ref={ref}
      className="h-[180px] overflow-y-auto snap-y snap-mandatory scrollbar-hide"
      style={{ scrollbarWidth: 'none' }}
      onScroll={() => {
        if (ref.current) {
          const itemHeight = 36;
          const index = Math.round(ref.current.scrollTop / itemHeight);
          if (index >= 0 && index < items.length && items[index].value !== selectedValue) {
            onChange(items[index].value);
          }
        }
      }}
    >
      {/* Top padding */}
      <div className="h-[72px]" />
      {items.map((item) => (
        <div
          key={item.value}
          className={`h-[36px] flex items-center justify-center text-sm snap-center cursor-pointer transition-all ${
            item.value === selectedValue
              ? 'text-primary font-bold text-base'
              : 'text-muted-foreground'
          }`}
          onClick={() => {
            onChange(item.value);
            scrollToItem(ref, items.findIndex(i => i.value === item.value));
          }}
        >
          {item.label}
        </div>
      ))}
      {/* Bottom padding */}
      <div className="h-[72px]" />
    </div>
  );

  return (
    <div className="bg-card rounded-xl border border-outline-variant/20 shadow-[0_2px_12px_rgba(49,37,27,0.08)] p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Calendar className="w-4 h-4 text-primary" />
        选择出生日期和时辰
      </div>
      {/* Highlight band */}
      <div className="relative">
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-[36px] bg-primary/5 rounded-lg pointer-events-none z-10 border-y border-primary/10" />
        <div className="grid grid-cols-4 gap-1">
          {renderItem(yearRef, YEAR_RANGE.map(y => ({ value: y, label: `${y}年` })), year, setYear)}
          {renderItem(monthRef, MONTH_RANGE.map(m => ({ value: m, label: `${m}月` })), month, setMonth)}
          {renderItem(dayRef, DAY_RANGE.map(d => ({ value: d, label: `${d}日` })), day, setDay)}
          {renderItem(shichenRef, SHICHEN_LABELS.map((l, i) => ({ value: i, label: l.split('(')[0] + '时' })), shichen, setShichen)}
        </div>
      </div>
      <div className="text-center text-xs text-muted-foreground">
        已选：{year}年{month}月{day}日 {SHICHEN_LABELS[shichen]}
      </div>
      <button
        onClick={handleConfirm}
        className="w-full py-2.5 min-h-[44px] bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        确认日期
      </button>
    </div>
  );
}

/* ── Main Chat Component ── */
export default function FortuneChat({
  systemPrompt,
  onMessagesChange,
  placeholder = '请输入消息...',
  initialMessages,
  onInfoCollected,
  showCollectButton = true,
  showDatePicker = false,
  onDateSelected,
}: FortuneChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages || []);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [datePickerVisible, setDatePickerVisible] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  useEffect(() => {
    onMessagesChange?.(messages);
  }, [messages, onMessagesChange]);

  const sendMessage = async (content?: string) => {
    const text = content || input.trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setStreamingContent('');
    setDatePickerVisible(false);

    try {
      abortRef.current = new AbortController();
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          systemPrompt,
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) throw new Error('请求失败');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          const lines = text.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') break;
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  fullContent += parsed.content;
                  setStreamingContent(fullContent);
                }
              } catch {
                // skip
              }
            }
          }
        }
      }

      const updated = [...newMessages, { role: 'assistant' as const, content: fullContent }];
      setMessages(updated);
      setStreamingContent('');
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        setMessages(prev => [...prev, { role: 'assistant', content: '抱歉，AI 服务暂时不可用，请稍后再试。' }]);
      }
    } finally {
      setIsLoading(false);
      setStreamingContent('');
    }
  };

  const handleDateConfirm = (dateStr: string, dateData: DateSelection) => {
    onDateSelected?.(dateData);
    sendMessage(dateStr);
  };

  const handleInfoCollectedClick = () => {
    // Pass the latest messages directly to the parent
    onInfoCollected?.(messages);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 p-3 md:p-4 min-h-[200px] md:min-h-[300px] max-h-[50vh] md:max-h-[500px]">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-8 text-sm">
            开始对话，AI 将引导您输入信息
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] px-4 py-2.5 rounded-xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card shadow-[0_2px_8px_rgba(49,37,27,0.08)] text-foreground'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && streamingContent && (
          <div className="flex justify-start">
            <div className="max-w-[80%] px-4 py-2.5 rounded-xl text-sm leading-relaxed bg-card shadow-[0_2px_8px_rgba(49,37,27,0.08)] text-foreground">
              {streamingContent}
              <span className="inline-block w-1.5 h-4 bg-primary ml-0.5 animate-pulse" />
            </div>
          </div>
        )}
        {isLoading && !streamingContent && (
          <div className="flex justify-start">
            <div className="px-4 py-2.5 rounded-xl bg-card shadow-[0_2px_8px_rgba(49,37,27,0.08)]">
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Date Picker (conditionally shown) */}
      {showDatePicker && datePickerVisible && (
        <div className="px-3 md:px-4 pb-2">
          <DatePickerWheel onConfirm={handleDateConfirm} />
        </div>
      )}

      {/* Input + Action */}
      <div className="p-3 md:p-4 border-t border-outline-variant/15 space-y-2">
        <div className="flex gap-2">
          {showDatePicker && (
            <button
              onClick={() => setDatePickerVisible(!datePickerVisible)}
              className="px-3 py-2.5 min-h-[44px] min-w-[44px] bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors"
              title="选择日期"
            >
              <Calendar className="w-4 h-4" />
            </button>
          )}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder={placeholder}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-card border border-outline-variant/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage()}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2.5 min-h-[44px] min-w-[44px] bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        {showCollectButton && onInfoCollected && (
          <button
            onClick={handleInfoCollectedClick}
            disabled={isLoading || messages.length < 1}
            className="w-full py-3 min-h-[48px] bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            信息已输入完毕，开始测算
          </button>
        )}
      </div>
    </div>
  );
}
