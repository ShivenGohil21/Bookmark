// 'use client';
// import { useEffect, useState } from 'react';
// import { supabase } from '@/app/lib/supabase';
// import { useRouter } from 'next/navigation';
// import Navbar from '@/app/components/navbar';

// interface Bookmark {
//   id: string;
//   title: string;
//   url: string;
//   created_at: string;
// }

// export default function Dashboard() {
//   const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
//   const [title, setTitle] = useState('');
//   const [url, setUrl] = useState('');
//   const [error, setError] = useState<string | null>(null);
//   const [success, setSuccess] = useState<string | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [user, setUser] = useState<any>(null);
//   const router = useRouter();

//   // 1. Fetch Data & Setup Realtime
//   useEffect(() => {
//     let channel: ReturnType<typeof supabase.channel> | null = null;

//     const init = async () => {
//       setError(null);

//       const { data: { user }, error: userError } = await supabase.auth.getUser();
//       if (userError) {
//         setError(userError.message);
//         return;
//       }

//       if (!user) {
//         router.replace('/login');
//         return;
//       }

//       setUser(user);

//       const { data, error: fetchError } = await supabase
//         .from('bookmarks')
//         .select('*')
//         .eq('user_id', user.id)
//         .order('created_at', { ascending: false });

//       if (fetchError) {
//         const msg = fetchError.message || 'Failed to fetch bookmarks';
//         const missingTable =
//           fetchError.code === 'PGRST205' ||
//           fetchError.code === '42P01' ||
//           /schema cache/i.test(msg) ||
//           /could not find/i.test(msg);

//         setError(
//           missingTable
//             ? 'The `bookmarks` table does not exist (or isn’t exposed yet). Run `database-setup.sql` in Supabase SQL Editor, then refresh.'
//             : msg
//         );
//         return;
//       }

//       setBookmarks(data || []);

//       // REALTIME SUBSCRIPTION (scoped to this user)
//       channel = supabase
//         .channel('bookmarks-realtime')
//         .on(
//           'postgres_changes',
//           {
//             event: '*',
//             table: 'bookmarks',
//             schema: 'public',
//             filter: `user_id=eq.${user.id}`,
//           },
//           (payload) => {
//             if (payload.eventType === 'INSERT') {
//               setBookmarks((prev) => [payload.new, ...prev]);
//             } else if (payload.eventType === 'DELETE') {
//               setBookmarks((prev) => prev.filter((b) => b.id !== payload.old.id));
//             }
//           }
//         )
//         .subscribe();
//     };

//     void init();

//     return () => {
//       if (channel) supabase.removeChannel(channel);
//     };
//   }, [router]);

//   // 2. Add Bookmark
//   const addBookmark = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError(null);
//     setSuccess(null);
//     setLoading(true);

//     const { data: { user } } = await supabase.auth.getUser();
//     if (!user) {
//       setError('You must be logged in to add bookmarks');
//       setLoading(false);
//       return;
//     }

//     // Validate URL
//     try {
//       new URL(url);
//     } catch {
//       setError('Please enter a valid URL');
//       setLoading(false);
//       return;
//     }

//     const { error: insertError } = await supabase.from('bookmarks').insert([{ title, url, user_id: user.id }]);
//     if (insertError) {
//       setError(insertError.message);
//     } else {
//       setSuccess('Bookmark added successfully!');
//       setTitle('');
//       setUrl('');
//       setTimeout(() => setSuccess(null), 3000);
//     }
//     setLoading(false);
//   };

//   // 3. Delete Bookmark
//   const deleteBookmark = async (id: string) => {
//     const { error: deleteError } = await supabase.from('bookmarks').delete().eq('id', id);
//     if (deleteError) {
//       setError(deleteError.message);
//     }
//   };

//   const copyToClipboard = (url: string) => {
//     navigator.clipboard.writeText(url);
//     setSuccess('URL copied to clipboard!');
//     setTimeout(() => setSuccess(null), 2000);
//   };

//   return (
//     <>
//       <Navbar />
//       <main className="max-w-6xl mx-auto px-6 md:px-12 py-12">
//         {/* Header */}
//         <div className="mb-12">
//           <h1 className="text-4xl md:text-5xl font-bold mb-2">Your Bookmarks</h1>
//           <p className="text-gray-400">Save and organize your favorite websites</p>
//         </div>

//         {/* Error & Success Messages */}
//         {error && (
//           <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
//             {error}
//           </div>
//         )}

//         {success && (
//           <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm">
//             ✓ {success}
//           </div>
//         )}

//         {/* Add Bookmark Form */}
//         <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 rounded-2xl p-8 mb-12 shadow-xl">
//           <h2 className="text-xl font-semibold mb-6">Add New Bookmark</h2>
//           <form onSubmit={addBookmark} className="space-y-4">
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//               <input
//                 type="text"
//                 placeholder="Title (e.g., Next.js Documentation)"
//                 value={title}
//                 onChange={(e) => setTitle(e.target.value)}
//                 required
//                 className="col-span-1 md:col-span-1 px-4 py-3 rounded-lg bg-slate-700/50 border border-white/10 placeholder-gray-500 focus:border-blue-500 focus:outline-none transition"
//               />
//               <input
//                 type="url"
//                 placeholder="URL (https://...)"
//                 value={url}
//                 onChange={(e) => setUrl(e.target.value)}
//                 required
//                 className="col-span-1 md:col-span-1 px-4 py-3 rounded-lg bg-slate-700/50 border border-white/10 placeholder-gray-500 focus:border-blue-500 focus:outline-none transition"
//               />
//               <button
//                 type="submit"
//                 disabled={loading}
//                 className="col-span-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 {loading ? 'Adding...' : '+ Add Bookmark'}
//               </button>
//             </div>
//           </form>
//         </div>

//         {/* Bookmarks Grid */}
//         {bookmarks.length === 0 ? (
//           <div className="text-center py-16">
//             <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
//               🔖
//             </div>
//             <h3 className="text-xl font-semibold mb-2">No bookmarks yet</h3>
//             <p className="text-gray-400">Start saving your favorite websites above</p>
//           </div>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//             {bookmarks.map((b) => (
//               <div
//                 key={b.id}
//                 className="group bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 rounded-xl p-6 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20 transition-all"
//               >
//                 <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-blue-400 transition">
//                   {b.title}
//                 </h3>
//                 <a
//                   href={b.url}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="text-sm text-blue-400 hover:text-blue-300 truncate block mb-4 transition"
//                 >
//                   {b.url}
//                 </a>
//                 <p className="text-xs text-gray-500 mb-4">
//                   {new Date(b.created_at).toLocaleDateString()}
//                 </p>
//                 <div className="flex gap-2">
//                   <button
//                     onClick={() => copyToClipboard(b.url)}
//                     className="flex-1 px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-sm hover:bg-slate-600 hover:border-white/20 transition"
//                   >
//                     Copy URL
//                   </button>
//                   <button
//                     onClick={() => deleteBookmark(b.id)}
//                     className="flex-1 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400 hover:bg-red-500/20 hover:border-red-500/40 transition"
//                   >
//                     Delete
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </main>
//     </>
//   );
// }


'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import { useRouter } from 'next/navigation';
import Navbar from '@/app/components/navbar';

interface Bookmark {
  id: string;
  title: string;
  url: string;
  created_at: string;
}

interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Bookmark;
  old: Bookmark;
}

export default function Dashboard() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  // 1. Fetch Data & Setup Realtime
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const init = async () => {
      setError(null);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        setError(userError.message);
        return;
      }

      if (!user) {
        router.replace('/login');
        return;
      }

      setUser(user);

      const { data, error: fetchError } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        const msg = fetchError.message || 'Failed to fetch bookmarks';
        const missingTable =
          fetchError.code === 'PGRST205' ||
          fetchError.code === '42P01' ||
          /schema cache/i.test(msg) ||
          /could not find/i.test(msg);

        setError(
          missingTable
            ? 'The `bookmarks` table does not exist. Run `database-setup.sql` in Supabase SQL Editor, then refresh.'
            : msg
        );
        return;
      }

      setBookmarks(data || []);

      // REALTIME SUBSCRIPTION (scoped to this user)
      channel = supabase
        .channel('bookmarks-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            table: 'bookmarks',
            schema: 'public',
            filter: `user_id=eq.${user.id}`,
          },
          (payload: any) => {
            if (payload.eventType === 'INSERT') {
              setBookmarks((prev) => [payload.new as Bookmark, ...prev]);
            } else if (payload.eventType === 'DELETE') {
              setBookmarks((prev) => prev.filter((b) => b.id !== payload.old.id));
            }
          }
        )
        .subscribe();
    };

    void init();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [router]);

  // 2. Add Bookmark
  const addBookmark = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('You must be logged in to add bookmarks');
      setLoading(false);
      return;
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      setError('Please enter a valid URL');
      setLoading(false);
      return;
    }

    const { error: insertError, data } = await supabase
      .from('bookmarks')
      .insert([{ title, url, user_id: user.id }])
      .select();

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
    } else {
      setSuccess('✓ Bookmark added successfully!');
      setTitle('');
      setUrl('');
      setTimeout(() => setSuccess(null), 3000);
      setLoading(false);
    }
  };

  // 3. Delete Bookmark
  const deleteBookmark = async (id: string) => {
    setError(null);
    const { error: deleteError } = await supabase.from('bookmarks').delete().eq('id', id);
    if (deleteError) {
      setError(deleteError.message);
    } else {
      setSuccess('✓ Bookmark deleted');
      setTimeout(() => setSuccess(null), 2000);
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setSuccess('✓ URL copied to clipboard!');
    setTimeout(() => setSuccess(null), 2000);
  };

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 md:px-12 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Your Bookmarks</h1>
          <p className="text-gray-400">Save and organize your favorite websites</p>
        </div>

        {/* Error & Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm">
            {success}
          </div>
        )}

        {/* Add Bookmark Form */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 rounded-2xl p-8 mb-12 shadow-xl">
          <h2 className="text-xl font-semibold mb-6">Add New Bookmark</h2>
          <form onSubmit={addBookmark} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Title (e.g., Next.js Documentation)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="col-span-1 md:col-span-1 px-4 py-3 rounded-lg bg-slate-700/50 border border-white/10 placeholder-gray-500 focus:border-blue-500 focus:outline-none transition"
              />
              <input
                type="url"
                placeholder="URL (https://...)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                className="col-span-1 md:col-span-1 px-4 py-3 rounded-lg bg-slate-700/50 border border-white/10 placeholder-gray-500 focus:border-blue-500 focus:outline-none transition"
              />
              <button
                type="submit"
                disabled={loading}
                className="col-span-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Adding...' : '+ Add Bookmark'}
              </button>
            </div>
          </form>
        </div>

        {/* Bookmarks Grid */}
        {bookmarks.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              🔖
            </div>
            <h3 className="text-xl font-semibold mb-2">No bookmarks yet</h3>
            <p className="text-gray-400">Start saving your favorite websites above</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookmarks.map((b) => (
              <div
                key={b.id}
                className="group bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 rounded-xl p-6 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20 transition-all"
              >
                <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-blue-400 transition">
                  {b.title}
                </h3>
                <a
                  href={b.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 hover:text-blue-300 truncate block mb-4 transition"
                >
                  {b.url}
                </a>
                <p className="text-xs text-gray-500 mb-4">
                  {new Date(b.created_at).toLocaleDateString()}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(b.url)}
                    className="flex-1 px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-sm hover:bg-slate-600 hover:border-white/20 transition"
                  >
                    Copy URL
                  </button>
                  <button
                    onClick={() => deleteBookmark(b.id)}
                    className="flex-1 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400 hover:bg-red-500/20 hover:border-red-500/40 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}