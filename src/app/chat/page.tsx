"use client";
import { useEffect, useState, useRef } from "react";
interface Message { id: number; senderId: number; receiverId: number; message: string; isRead: boolean; createdAt: string; senderFirstName: string | null; senderLastName: string | null; }
interface Employee { id: number; firstName: string; lastName: string; }

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedUser, setSelectedUser] = useState<Employee | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const currentUserId = 1;

  useEffect(() => { fetch("/api/users?status=ishlaydi").then((r) => r.json()).then(setEmployees); }, []);
  useEffect(() => { if (!selectedUser) return; setLoading(true); fetch(`/api/chat?userId=${currentUserId}&otherUserId=${selectedUser.id}`).then((r) => r.json()).then(setMessages).finally(() => setLoading(false)); }, [selectedUser]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async () => {
    if (!text.trim() || !selectedUser) return;
    await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ senderId: currentUserId, receiverId: selectedUser.id, message: text }) });
    setText("");
    setMessages(await (await fetch(`/api/chat?userId=${currentUserId}&otherUserId=${selectedUser.id}`)).json());
  };

  return (
    <div className="space-y-6 animate-fade-in h-[calc(100vh-160px)]">
      <div className="apple-page-header"><h1>Chat</h1><p>Xodimlar bilan ichki suhbat</p></div>
      <div className="flex gap-3 h-full">
        <div className="w-60 apple-card overflow-hidden flex flex-col">
          <div className="p-3 border-b border-black/5"><p className="text-[10px] font-semibold uppercase tracking-wider text-black/30">Xodimlar</p></div>
          <div className="flex-1 overflow-y-auto">
            {employees.map((emp) => (
              <button key={emp.id} onClick={() => setSelectedUser(emp)} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-black/[0.02] border-b border-black/[0.02] transition-colors ${selectedUser?.id === emp.id ? "bg-[#0071e3]/5 border-l-2 border-l-[#0071e3]" : ""}`}>
                <span className="font-medium text-black/80">{emp.firstName} {emp.lastName}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 apple-card overflow-hidden flex flex-col">
          {selectedUser ? (
            <>
              <div className="px-5 py-3 border-b border-black/5"><p className="font-medium text-sm">{selectedUser.firstName} {selectedUser.lastName}</p></div>
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {messages.map((msg) => {
                  const isMine = msg.senderId === currentUserId;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[65%] rounded-2xl px-4 py-2.5 text-sm ${isMine ? "bg-[#0071e3] text-white" : "bg-black/[0.04] text-black/80"}`}>
                        <p>{msg.message}</p>
                        <p className={`text-[10px] mt-1 ${isMine ? "text-white/60" : "text-black/30"}`}>{new Date(msg.createdAt).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
              <div className="p-3 border-t border-black/5 flex gap-2">
                <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="Xabar yozing..." className="apple-input flex-1" />
                <button onClick={sendMessage} className="apple-btn">Yuborish</button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-black/30 text-sm">Suhbatni boshlash uchun xodimni tanlang</div>
          )}
        </div>
      </div>
    </div>
  );
}
