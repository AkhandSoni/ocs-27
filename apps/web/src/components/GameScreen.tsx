"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { Bot, Check, ChevronLeft, Gamepad2, Grid2X2, LogOut, MoreHorizontal, Plus, Search, Settings, UserRound, Users, X } from "lucide-react";
import styles from "./GameScreen.module.css";

type Player = { id: string; name: string; email: string; avatar: string };
type Props = { player?: Player | null; suspended?: boolean; onGameChange?: (color: string, title: string) => void };
type Game = { id: string; title: string; tagline: string; description: string; color: string; genre: string };
const games: Game[] = [
  { id: "astro-bot", title: "ASTRO BOT", tagline: "JOIN ASTRO ON A SUPERSIZED SPACE ADVENTURE", description: "Explore extraordinary worlds, rescue your crew, and discover a galaxy full of surprises in ASTRO’s biggest adventure yet.", color: "#4092ff", genre: "Platformer · Adventure" },
  { id: "elden-ring", title: "ELDEN RING", tagline: "RISE, TARNISHED, AND BECOME THE ELDEN LORD", description: "Journey through the Lands Between. Discover a vast world, face formidable enemies, and forge your own path.", color: "#dfb45e", genre: "Action RPG · Open world" },
  { id: "god-of-war", title: "GOD OF WAR", tagline: "A NEW BEGINNING. A BOND WORTH FIGHTING FOR.", description: "Enter the realm of Norse gods with Kratos and Atreus. Explore wild landscapes and discover what it means to be a father.", color: "#75c3e8", genre: "Action · Adventure" },
  { id: "spider-man", title: "MARVEL’S SPIDER-MAN", tagline: "BE GREATER", description: "Swing through Marvel’s New York. Master acrobatic combat and explore a spectacular city as Peter Parker.", color: "#e84854", genre: "Action · Open world" },
  { id: "fc-24", title: "EA SPORTS FC 24", tagline: "WELCOME TO THE WORLD’S GAME", description: "Get closer to the action. Build your dream squad and take your place on the pitch.", color: "#72cf9e", genre: "Sports · Football" },
  { id: "ghost-of-tsushima", title: "GHOST OF TSUSHIMA", tagline: "A STORM IS COMING. BECOME THE GHOST.", description: "Beyond war, ancient beauty endures. Roam the sweeping countryside of Tsushima and discover a new way forward.", color: "#cbb789", genre: "Action · Open world" },
  { id: "stray", title: "STRAY", tagline: "A LITTLE LOST. A WORLD TO DISCOVER.", description: "Untangle an ancient mystery as a stray cat in a forgotten cybercity. Meet curious robots and find your way home.", color: "#e69a67", genre: "Adventure · Exploration" },
  { id: "forza-horizon-5", title: "FORZA HORIZON 5", tagline: "YOUR ULTIMATE HORIZON ADVENTURE AWAITS", description: "Lead breathtaking expeditions across the vibrant landscapes of Mexico in hundreds of the world’s greatest cars.", color: "#db8cb9", genre: "Racing · Open world" },
];
const media = [
  { id: "youtube", name: "YouTube", color: "#e21a25", url: "https://www.youtube.com" },
  { id: "netflix", name: "NETFLIX", color: "#b90916", url: "https://www.netflix.com" },
  { id: "spotify", name: "Spotify", color: "#176c3b", url: "https://open.spotify.com" },
  { id: "prime", name: "prime video", color: "#0879b3", url: "https://www.primevideo.com" },
];
const avatarColors: Record<string,string> = { astro: "#2884d6", horizon: "#d39153", cosmic: "#42628f", sunset: "#ca755e", forest: "#527c65", violet: "#7e65ab" };

export default function GameScreen({ player, suspended = false, onGameChange }: Props) {
  const [selectedId, setSelectedId] = useState(games[0].id);
  const [tab, setTab] = useState<"games" | "media">("games");
  const [mediaId, setMediaId] = useState("youtube");
  const [panel, setPanel] = useState<"search" | "settings" | "profile" | "library" | "details" | null>(null);
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<string[]>([]);
  const [launching, setLaunching] = useState(false);
  const [time, setTime] = useState("");
  const screenRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const launchRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const hadOverlayRef = useRef(false);
  const overlayOpen = panel !== null || launching;
  const game = games.find(item => item.id === selectedId) ?? games[0];
  const app = media.find(item => item.id === mediaId) ?? media[0];
  const name = player?.name ?? "Player";
  const filteredGames = games.filter(item => item.title.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => { onGameChange?.(game.color, game.title); }, [game, onGameChange]);
  useEffect(() => {
    const updateTime = () => setTime(new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date()));
    updateTime(); const timer = setInterval(updateTime, 60000); return () => clearInterval(timer);
  }, []);
  useEffect(() => { if (!suspended) screenRef.current?.focus({ preventScroll: true }); }, [suspended]);
  useLayoutEffect(() => {
    if (suspended) return;
    const dialog = launching ? launchRef.current : panelRef.current;
    if (overlayOpen && dialog) {
      const initial = panel === "search" ? dialog.querySelector<HTMLElement>("input") : dialog.querySelector<HTMLElement>('button:not([disabled]),a[href],input:not([disabled])');
      (initial ?? dialog).focus({ preventScroll: true });
    } else if (hadOverlayRef.current) {
      const opener = openerRef.current;
      (opener?.isConnected && !opener.closest("[inert]") ? opener : screenRef.current)?.focus({ preventScroll: true });
      openerRef.current = null;
    }
    hadOverlayRef.current = overlayOpen;
  }, [panel, launching, overlayOpen, suspended]);
  useEffect(() => {
    if (!overlayOpen || suspended) return;
    const dialog = launching ? launchRef.current : panelRef.current;
    if (!dialog) return;
    function focusable() {
      return Array.from(dialog!.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')).filter(node => node.getClientRects().length > 0 && !node.closest("[inert]"));
    }
    function containKeys(event: globalThis.KeyboardEvent) {
      if (!dialog?.isConnected || dialog.closest("[inert]")) return;
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); setPanel(null); setLaunching(false); return; }
      if (event.key !== "Tab") return;
      const nodes = focusable();
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (!first) { event.preventDefault(); dialog.focus({ preventScroll: true }); return; }
      if (!dialog.contains(document.activeElement) || document.activeElement === dialog) { event.preventDefault(); (event.shiftKey ? last : first).focus({ preventScroll: true }); }
      else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus({ preventScroll: true }); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus({ preventScroll: true }); }
    }
    function containFocus(event: FocusEvent) {
      if (dialog?.isConnected && !dialog.closest("[inert]") && event.target instanceof Node && !dialog.contains(event.target)) (focusable()[0] ?? dialog).focus({ preventScroll: true });
    }
    document.addEventListener("keydown", containKeys, true);
    document.addEventListener("focusin", containFocus, true);
    return () => { document.removeEventListener("keydown", containKeys, true); document.removeEventListener("focusin", containFocus, true); };
  }, [panel, launching, overlayOpen, suspended]);

  function rememberOpener(opener?: HTMLElement) {
    if (!overlayOpen) openerRef.current = opener ?? (document.activeElement instanceof HTMLElement ? document.activeElement : screenRef.current);
  }
  function openPanel(nextPanel: NonNullable<typeof panel>, opener?: HTMLElement) { rememberOpener(opener); setLaunching(false); setPanel(nextPanel); }
  function closeOverlay() { setPanel(null); setLaunching(false); }
  function openLaunch(opener?: HTMLElement) { rememberOpener(opener); setPanel(null); setLaunching(true); }

  function selectGame(id: string) { setSelectedId(id); closeOverlay(); setTab("games"); }
  function handleKeys(event: KeyboardEvent<HTMLDivElement>) {
    if (panel || launching || !["ArrowRight", "ArrowLeft"].includes(event.key)) return;
    event.preventDefault();
    screenRef.current?.focus({ preventScroll: true });
    const delta = event.key === "ArrowRight" ? 1 : -1;
    if (tab === "games") setSelectedId(games[(games.findIndex(item => item.id === selectedId) + delta + games.length) % games.length].id);
    else setMediaId(media[(media.findIndex(item => item.id === mediaId) + delta + media.length) % media.length].id);
  }
  function openUsers() { closeOverlay(); window.dispatchEvent(new Event("ps5:open-users")); }

  return (
    <div className={styles.screen} style={{ "--game-accent": game.color } as CSSProperties} data-game-screen ref={screenRef} tabIndex={overlayOpen ? -1 : 0} role="region" aria-label="PlayStation home" onKeyDown={handleKeys}>
      <div inert={overlayOpen} aria-hidden={overlayOpen || undefined} style={{ position: "absolute", inset: 0 }}>
      <div className={`${styles.artwork} ${tab === "media" ? styles.mediaArt : ""}`} aria-hidden="true">
        {games.map(item => <img key={item.id} className={item.id === game.id ? styles.activeArtwork : ""} src={`/games/${item.id}-hero.jpg`} alt="" draggable={false} />)}
      </div>
      <div className={styles.shade} aria-hidden="true" />
      <header className={styles.header}>
        <nav className={styles.tabs} aria-label="Console navigation"><button className={tab === "games" ? styles.activeTab : ""} onClick={() => setTab("games")} aria-current={tab === "games" ? "page" : undefined}>Games</button><button className={tab === "media" ? styles.activeTab : ""} onClick={() => setTab("media")} aria-current={tab === "media" ? "page" : undefined}>Media</button></nav>
        <div className={styles.system}><button onClick={event => { setQuery(""); openPanel("search", event.currentTarget); }} aria-label="Search games"><Search size={26} /></button><button onClick={event => openPanel("settings", event.currentTarget)} aria-label="Settings"><Settings size={25} fill="currentColor" strokeWidth={1.3} /></button><button className={styles.avatar} style={{ background: avatarColors[player?.avatar ?? "astro"] }} onClick={event => openPanel("profile", event.currentTarget)} aria-label={`Open ${name} profile`}>{player?.avatar === "astro" || !player?.avatar ? <Bot size={29} /> : name[0].toUpperCase()}<i /></button><time>{time}</time></div>
      </header>

      {tab === "games" ? <>
        <div className={styles.gameRail} role="group" aria-label="Games"><button className={styles.libraryTile} onClick={event => openPanel("library", event.currentTarget)} aria-label="Open game library"><Gamepad2 size={32} /></button>{games.slice(0, 7).map(item => <button key={item.id} aria-label={`Select ${item.title}`} aria-pressed={game.id === item.id} className={`${styles.gameTile} ${item.id === game.id ? styles.selectedTile : ""}`} onClick={() => selectGame(item.id)}><img src={`/games/${item.id}-cover.jpg`} alt={item.title} draggable={false} />{item.id === game.id && <span className={styles.selectedCaption}>{item.title}</span>}</button>)}<button className={styles.libraryTile} onClick={event => openPanel("library", event.currentTarget)} aria-label="View all games"><Grid2X2 size={32} /></button></div>
        <div className={styles.gameContent} key={game.id}><h1 className={`${styles.gameTitle} ${game.id === "astro-bot" ? styles.astroTitle : ""}`}>{game.title}</h1>{game.id === "astro-bot" && <p>{game.tagline}</p>}<div className={styles.actions}><button className={styles.playButton} onClick={event => openLaunch(event.currentTarget)} aria-label={`Play ${game.title}`}>Play Game</button><button className={styles.moreButton} onClick={event => openPanel("details", event.currentTarget)} aria-label={`More options for ${game.title}`}><MoreHorizontal size={27} /></button></div></div>
      </> : <>
        <div className={styles.gameRail} role="group" aria-label="Media apps">{media.map(item => <button key={item.id} className={`${styles.mediaTile} ${item.id === mediaId ? styles.selectedMedia : ""}`} style={{ background: item.color }} aria-label={`Select ${item.name}`} aria-pressed={item.id === mediaId} onClick={() => setMediaId(item.id)}>{item.name}</button>)}</div><div className={styles.gameContent}><h1 className={styles.gameTitle}>{app.name}</h1><div className={styles.actions}><a className={styles.playButton} href={app.url} target="_blank" rel="noreferrer">Start</a></div></div>
      </>}
      </div>

      {panel === "profile" && <div style={{ position: "absolute", inset: 0, zIndex: 10 }} onClick={closeOverlay}><div className={styles.profilePanel} ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="User profile" onClick={event => event.stopPropagation()}><div className={styles.profileIdentity}><span className={styles.profileAvatar} style={{ background: avatarColors[player?.avatar ?? "astro"] }}><UserRound size={30} /></span><div><strong>{name}</strong><span>Online</span></div></div><button onClick={openUsers}><Users size={20} /> Switch User</button><button onClick={() => { closeOverlay(); window.dispatchEvent(new Event("ps5:logout")); }}><LogOut size={20} /> Log Out</button><button onClick={closeOverlay}><X size={20} /> Close</button></div></div>}

      {panel && panel !== "profile" && <div className={styles.modalBackdrop} onClick={closeOverlay}><div ref={panelRef} tabIndex={-1} className={`${styles.panel} ${panel === "details" ? styles.detailsPanel : ""}`} role="dialog" aria-modal="true" aria-label={panel === "search" ? "Search games" : panel === "library" ? "Game Library" : panel === "settings" ? "Settings" : `${game.title} details`} onClick={event => event.stopPropagation()}>
        <button className={styles.closeButton} onClick={closeOverlay} aria-label="Close panel"><X size={26} /></button>
        {panel === "search" && <><h2>Search</h2><label className={styles.searchField}><Search size={25} /><input aria-label="Search your games" placeholder="Search games" value={query} onChange={event => setQuery(event.target.value)} /></label><div className={styles.searchResults}>{filteredGames.map(item => <button key={item.id} onClick={() => selectGame(item.id)}><img src={`/games/${item.id}-cover.jpg`} alt="" /><span>{item.title}<small>{item.genre}</small></span></button>)}{!filteredGames.length && <p>No games found.</p>}</div></>}
        {panel === "library" && <><h2>Game Library</h2><div className={styles.libraryGrid}>{games.map(item => <button key={item.id} onClick={() => selectGame(item.id)} aria-label={`Open ${item.title}`}><img src={`/games/${item.id}-cover.jpg`} alt={item.title} /><span>{item.title}</span></button>)}</div></>}
        {panel === "settings" && <><h2>Users and Accounts</h2><div className={styles.settingRows}><button onClick={openUsers}><span>Switch User<small>{name}</small></span><Users size={24} /></button><button onClick={() => { closeOverlay(); window.dispatchEvent(new Event("ps5:logout")); }}><span>Log Out</span><LogOut size={24} /></button></div></>}
        {panel === "details" && <><div className={styles.detailsArt} style={{backgroundImage:`url(/games/${game.id}-hero.jpg)`}} /><div className={styles.detailsBody}><span className={styles.ps5Label}>PS5</span><h2>{game.title}</h2><p>{game.description}</p><small>{game.genre}</small><div className={styles.actions}><button className={styles.playButton} onClick={event => openLaunch(event.currentTarget)}>Play Game</button><button className={styles.saveButton} onClick={() => setSaved(saved.includes(game.id) ? saved.filter(id => id!==game.id) : [...saved,game.id])}>{saved.includes(game.id) ? <Check size={21} /> : <Plus size={21} />}{saved.includes(game.id) ? "Added to Favorites" : "Add to Favorites"}</button></div></div></>}
      </div></div>}
      {launching && <div className={styles.launchScreen} ref={launchRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={`${game.title} launch screen`}><img src={`/games/${game.id}-hero.jpg`} alt="" /><div /><h2>{game.title}</h2><button className={styles.returnButton} onClick={closeOverlay}><ChevronLeft size={22} /> Return to Home</button></div>}
    </div>
  );
}
