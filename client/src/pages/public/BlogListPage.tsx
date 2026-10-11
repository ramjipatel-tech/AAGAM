import React, { useState, useEffect } from 'react';
import { BookOpen, Calendar, User, ArrowRight, Tag } from 'lucide-react';
import { BlogArticle } from '../../types';
import { api } from '../../services/api';

export const BlogListPage: React.FC = () => {
  const [blogs, setBlogs] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBlog, setActiveBlog] = useState<BlogArticle | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.getBlogs();
        if (res.success) setBlogs(res.blogs);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (activeBlog) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <button
          onClick={() => setActiveBlog(null)}
          className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1.5"
        >
          ← Back to All Articles
        </button>

        <div className="space-y-4">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-sky-100 text-sky-800">
            {activeBlog.category}
          </span>
          <h1 className="font-heading font-black text-3xl sm:text-5xl text-slate-900 leading-tight">
            {activeBlog.title}
          </h1>

          <div className="flex items-center gap-4 text-xs text-slate-500 pb-4 border-b border-slate-200">
            <span>By <b className="text-slate-800">{activeBlog.author}</b></span>
            <span>•</span>
            <span>{activeBlog.read_time}</span>
            <span>•</span>
            <span>{activeBlog.published_at ? activeBlog.published_at.split('T')[0] : 'Recent'}</span>
          </div>

          <div className="prose prose-slate max-w-none text-slate-700 text-base leading-relaxed space-y-4 pt-4">
            <p className="font-semibold text-lg text-slate-900">{activeBlog.excerpt}</p>
            <p className="whitespace-pre-line">{activeBlog.content}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-bold uppercase tracking-wider">
          Engineering & Career Insights
        </div>
        <h1 className="font-heading font-extrabold text-4xl sm:text-5xl text-slate-900">
          AAGAM Technology Blog
        </h1>
        <p className="text-slate-600 text-sm leading-relaxed">
          Technical guides, career roadmaps, system architecture deep dives, and academic NOC compliance tips.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500 text-sm">Loading articles...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {blogs.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-sky-50 text-sky-700">
                    {b.category}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">{b.read_time}</span>
                </div>

                <h3 className="font-heading font-bold text-2xl text-slate-900 hover:text-sky-600 transition-colors cursor-pointer" onClick={() => setActiveBlog(b)}>
                  {b.title}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {b.excerpt}
                </p>

                <div className="flex items-center gap-2 text-xs text-slate-500 pt-2">
                  <span>Author: <b className="text-slate-700">{b.author}</b></span>
                </div>
              </div>

              <div className="pt-6 mt-4 border-t border-slate-100">
                <button
                  onClick={() => setActiveBlog(b)}
                  className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1.5"
                >
                  <span>Read Full Article</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
