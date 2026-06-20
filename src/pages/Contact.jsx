"use client";

import { useState } from "react";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import toast, { Toaster } from "react-hot-toast";

export default function Contact() {
  useDocumentTitle("Contact");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    message: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success("Message sent successfully!");
    setForm({ firstName: "", lastName: "", email: "", message: "" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-6 py-20 [data-mode='light']:bg-slate-50">
      <Toaster position="top-right" />
      <div className="w-full max-w-2xl bg-white/5 backdrop-blur-lg border border-white/10 p-12 rounded-3xl shadow-2xl [data-mode='light']:bg-white [data-mode='light']:border-slate-200">
        <h2 className="text-4xl font-extrabold text-white mb-3 text-center tracking-wide [data-mode='light']:text-slate-900">
          Get in Touch
        </h2>
        <p className="text-slate-400 text-center mb-12 text-lg [data-mode='light']:text-slate-600">
          Have questions or want to contribute? Send us a message.
        </p>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-slate-300 mb-2 [data-mode='light']:text-slate-700">First Name</label>
              <input
                type="text"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                required
                className="w-full bg-slate-900 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all [data-mode='light']:bg-slate-100 [data-mode='light']:border-slate-200 [data-mode='light']:text-slate-900"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-2 [data-mode='light']:text-slate-700">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                required
                className="w-full bg-slate-900 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all [data-mode='light']:bg-slate-100 [data-mode='light']:border-slate-200 [data-mode='light']:text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 mb-2 [data-mode='light']:text-slate-700">Email Address</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full bg-slate-900 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all [data-mode='light']:bg-slate-100 [data-mode='light']:border-slate-200 [data-mode='light']:text-slate-900"
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-2 [data-mode='light']:text-slate-700">Your Message</label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              rows={5}
              required
              className="w-full bg-slate-900 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none [data-mode='light']:bg-slate-100 [data-mode='light']:border-slate-200 [data-mode='light']:text-slate-900"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold py-4 rounded-2xl text-lg shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
}