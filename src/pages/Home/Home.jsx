import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useLayoutEffect,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Layout from "../../components/sidebar/layout";
import "./home.css";

import { db } from "../../firebase";
import {
  doc,
  collection,
  onSnapshot,
  updateDoc,
  runTransaction,
  getDoc,
} from "firebase/firestore";
import { observeAuthState } from "../../auth";

/* Eventos e pesqueiros vêm da API do catálogo (server/).
 * O hook cai no conteúdo local de src/data/catalogoReserva.js se a API
 * estiver fora, então a tela nunca fica sem conteúdo. */
import { useCatalogo } from "../../hooks/useCatalogo";
import { registrarEvento } from "../../analytics";
import Seo from "../../components/Seo/Seo";

/* ─────────────────────────────────────────
   Utilitário: extrai até 2 iniciais do nome
   Ex: "João Pedro" → "JP" | "Danilo" → "D"
───────────────────────────────────────── */
function gerarIniciais(nome) {
  if (!nome) return "?";
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function AvatarInicial({ nome, size = "md", className = "", onClick }) {
  const iniciais = gerarIniciais(nome);
  return (
    <div
      className={`avatar-inicial avatar-inicial--${size} ${className}`}
      aria-label={`Avatar de ${nome || "usuário"}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
    >
      {iniciais}
    </div>
  );
}

function PostCardSkeleton() {
  return (
    <article className="post-card post-card-skeleton" aria-hidden="true">
      {/* Cabeçalho */}
      <div className="post-header">
        <div className="skeleton-avatar" />
        <div className="skeleton-author-info">
          <div className="skeleton-line skeleton-line--name" />
          <div className="skeleton-line skeleton-line--meta" />
        </div>
      </div>

      {/* Imagem */}
      <div className="skeleton-image" />

      {/* Separador */}
      <div className="post-interact-bar" />

      {/* Stats */}
      <div className="post-stats-row">
        <div className="skeleton-line skeleton-line--stat" />
        <div className="skeleton-line skeleton-line--stat" />
      </div>

      {/* Ações */}
      <div className="post-actions-row">
        <div className="skeleton-action" />
        <div className="skeleton-action" />
        <div className="skeleton-action" />
      </div>
    </article>
  );
}

/* Hook simples para detectar mobile (≤ 480px) */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 480);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 480px)");
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

/* ─────────────────────────────────────────
   PostCard real
───────────────────────────────────────── */
function PostCard({
  post,
  user,
  usuarioDados,
  onCurtir,
  onComentar,
  onVerPerfil,
  onVerPost,
}) {
  const [linkCopiado, setLinkCopiado] = useState(false);
  const [comentAberto, setComentAberto] = useState(false);
  const [inputComentario, setInputComentario] = useState("");
  const [fotosComentarios, setFotosComentarios] = useState({});
  const inputRef = useRef(null);
  const isMobile = useIsMobile();

  const curtidas = post.curtidas || [];
  const comentarios = post.comentarios || [];
  const jaCurtiu = user && curtidas.includes(user.uid);

  const toggleComentarios = () => {
    setComentAberto((prev) => {
      const next = !prev;
      if (next) setTimeout(() => inputRef.current?.focus(), 50);
      return next;
    });
  };

  const enviarComentario = () => {
    if (!inputComentario.trim()) return;
    onComentar(post, inputComentario);
    setInputComentario("");
  };

  const copiarLink = async () => {
    const url = `${window.location.origin}/post/${post.autorId}/${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopiado(true);
      setTimeout(() => setLinkCopiado(false), 2000);
    } catch {
      // fallback silencioso
    }
  };

  useEffect(() => {
    const carregarFotosComentarios = async () => {
      const semFoto = comentarios.filter((c) => c.autorId && !c.autorFoto);
      if (semFoto.length === 0) return;

      const novasFotos = {};
      await Promise.all(
        semFoto.map(async (c) => {
          try {
            const snap = await getDoc(doc(db, "usuarios", c.autorId));
            if (snap.exists())
              novasFotos[c.autorId] = snap.data().fotoPerfil || "";
          } catch (error) {
            console.error("Erro ao carregar foto do comentário:", error);
          }
        }),
      );
      setFotosComentarios((prev) => ({ ...prev, ...novasFotos }));
    };

    carregarFotosComentarios();
  }, [comentarios]);

  return (
    <article className="post-card">
      {/* ── Cabeçalho ── */}
      <div className="post-header">
        {post.autorFoto ? (
          <img
            src={post.autorFoto}
            alt={post.autorNome}
            className="post-author-img post-author-img--clickable"
            onClick={() => onVerPerfil(post.autorId)}
          />
        ) : (
          <AvatarInicial
            nome={post.autorNome}
            size="md"
            className="post-author-img--clickable"
            onClick={() => onVerPerfil(post.autorId)}
          />
        )}
        <div className="post-author-info">
          <div className="post-author-wrapper">
            <h3
              className="post-author post-author--link"
              onClick={() => onVerPerfil(post.autorId)}
            >
              {post.autorNome}
            </h3>
            {post.autorUsername && (
              <div className="post-author-username-container">
                <span className="post-author-username">
                  @{post.autorUsername}
                </span>
              </div>
            )}
          </div>
          <p className="post-meta">
            {post.local && `${post.local} · `}
            {post.data}
          </p>
        </div>
        <button className="post-menu" aria-label="Mais opções">
          <span className="material-symbols-outlined">more_vert</span>
        </button>
      </div>

      {/* ── Descrição ── */}
      {post.comentario && post.comentario !== "Sem descrição" && (
        <div className="post-content">
          <p>{post.comentario}</p>
        </div>
      )}

      {/* ── Imagem ── */}
      {post.imagem && (
        <div
          className="post-main-image-container post-main-image-container--clickable"
          onClick={() => onVerPost(post.autorId, post.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) =>
            e.key === "Enter" && onVerPost(post.autorId, post.id)
          }
          aria-label="Ver publicação completa"
        >
          <img src={post.imagem} alt="Publicação" className="post-main-image" />
        </div>
      )}

      {/* ── Tags ── */}
      {post.tags?.length > 0 && (
        <div className="post-tags-row">
          {post.tags.map((t) => (
            <span key={t} className="post-tag">
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="post-interact-bar" />

      {/* ── Contadores ── */}
      <div className="post-stats-row">
        <span>
          {curtidas.length} curtida{curtidas.length !== 1 ? "s" : ""}
        </span>
        <button
          className="post-stats-comentarios-btn"
          onClick={toggleComentarios}
          aria-expanded={comentAberto}
        >
          {comentarios.length} comentário{comentarios.length !== 1 ? "s" : ""}
        </button>
      </div>

      {/* ── Botões de ação ── */}
      <div className="post-actions-row">
        <button
          className={`action-btn ${jaCurtiu ? "action-btn-ativo" : ""}`}
          onClick={() => onCurtir(post)}
          aria-label={jaCurtiu ? "Descurtir" : "Curtir"}
          aria-pressed={jaCurtiu}
        >
          <span
            className={`material-symbols-outlined like-icon ${jaCurtiu ? "like-icon--ativo" : ""}`}
          >
            {jaCurtiu ? "favorite" : "favorite_border"}
          </span>
          <span className="action-btn-label">
            {isMobile
              ? curtidas.length > 0
                ? curtidas.length
                : ""
              : jaCurtiu
                ? "Curtido"
                : "Curtir"}
          </span>
        </button>

        <button
          className={`action-comentario-btn ${comentAberto ? "action-btn-comentario-ativo" : ""}`}
          onClick={toggleComentarios}
          aria-label="Comentar"
          aria-expanded={comentAberto}
        >
          <span className="material-symbols-outlined">
            {comentAberto ? "chat_bubble" : "chat_bubble_outline"}
          </span>
          <span className="action-btn-comentario-label">
            {isMobile
              ? comentarios.length > 0
                ? comentarios.length
                : ""
              : "Comentar"}
          </span>
        </button>

        <button
          className={`action-compartilhar-btn ${linkCopiado ? "action-btn-compartilhar-ativo" : ""}`}
          onClick={copiarLink}
        >
          <span className="material-symbols-outlined">
            {linkCopiado ? "check" : "share"}
          </span>
          <span className="action-compartilhar-btn-label">
            {isMobile
              ? linkCopiado
                ? "Copiado!"
                : "Copiar"
              : linkCopiado
                ? "Link copiado!"
                : "Compartilhar"}
          </span>
        </button>
      </div>

      {/* ── Área de comentários ── */}
      {comentAberto && (
        <div className="post-comments-area">
          {comentarios.length > 0 ? (
            comentarios.map((c) => (
              <div key={c.id ?? c.data} className="comment-item">
                {c.autorFoto || fotosComentarios[c.autorId] ? (
                  <img
                    src={c.autorFoto || fotosComentarios[c.autorId]}
                    alt={c.autorNome}
                    className="comment-avatar-img comment-avatar-img--clickable"
                    onClick={() => c.autorId && onVerPerfil(c.autorId)}
                  />
                ) : (
                  <AvatarInicial
                    nome={c.autorNome}
                    size="sm"
                    className="comment-avatar-img--clickable"
                    onClick={() => c.autorId && onVerPerfil(c.autorId)}
                  />
                )}
                <div className="comment-content-bubble">
                  <div className="comment-author-wrapper">
                    <span
                      className="comment-author-name comment-author-name--clickable"
                      onClick={() => c.autorId && onVerPerfil(c.autorId)}
                    >
                      {c.autorNome}
                    </span>
                    {c.autorUsername && (
                      <div className="comment-author-username-container">
                        <span className="comment-author-username">
                          @{c.autorUsername}
                        </span>
                      </div>
                    )}
                  </div>
                  <p>{c.texto}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="comment-empty">
              Nenhum comentário ainda. Seja o primeiro!
            </p>
          )}

          {user && (
            <div className="comment-input-wrapper-disabled">
              <div className="comment-disabled-message">
                <span className="material-symbols-outlined">info</span>
                Comentários temporariamente indisponíveis nesta versão na página
                Home.
              </div>

              <div className="comment-input comment-input-disabled">
                {usuarioDados?.fotoPerfil ? (
                  <img
                    src={usuarioDados.fotoPerfil}
                    alt="Você"
                    className="comment-avatar"
                  />
                ) : (
                  <AvatarInicial nome={usuarioDados?.nome} size="sm" />
                )}

                <input
                  type="text"
                  placeholder="Comentários desativados"
                  disabled
                />

                <button className="comment-btn" disabled>
                  <span className="material-symbols-outlined">send</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

/* ─────────────────────────────────────────
   Componente principal: Home
───────────────────────────────────────── */
const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();

  /* ── Autenticação ── */
  const [user, setUser] = useState(null);
  const [usuarioDados, setUsuarioDados] = useState(null);

  /* ── Feed ── */
  const [feedPosts, setFeedPosts] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);

  const [feedPronto, setFeedPronto] = useState(false);

  /* ── UI ── */
  const [activeTab, setActiveTab] = useState("para-voce");
  const [eventoIndex, setEventoIndex] = useState(0);
  const [localIndex, setLocalIndex] = useState(0);

  /* ── Refs ── */
  const stickyRef = useRef(null);
  const scrollRestorado = useRef(false);
  const [stickyHeight, setStickyHeight] = useState(0);

  /* ── Sticky bar resize observer ── */
  useEffect(() => {
    const el = stickyRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) =>
      setStickyHeight(entry.contentRect.height),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* ── Catálogo (API + reserva local) ──
   * Antes estes dois arrays estavam escritos à mão aqui. Agora vêm do
   * MySQL pela API; a reserva local entra se ela não responder. */
  const { eventos, pesqueiros: locais, origem: origemCatalogo } = useCatalogo();

  /* ── Tour ── */
  useEffect(() => {
    if (location.state?.showTour) {
      localStorage.setItem("tourAtivo", "true");
      localStorage.removeItem("tourConcluido");
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  /* ── Auth ── */
  useEffect(() => {
    const unsub = observeAuthState(setUser);
    return unsub;
  }, []);

  /* ── Feed em tempo real (TODOS os usuários da plataforma) ── */
  useEffect(() => {
    if (!user) return;

    const secondaryUnsubs = {};
    const postsMap = {};

    const recalcFeed = () => {
      const todos = Object.values(postsMap).flat();
      todos.sort((a, b) => (b.id || 0) - (a.id || 0));
      setFeedPosts(todos);
      setFeedLoading(false);
    };

    const subscribeToUser = (uid, data) => {
      // Se já está inscrito, só atualiza os posts com os dados recebidos
      if (secondaryUnsubs[uid]) return;
      secondaryUnsubs[uid] = onSnapshot(doc(db, "usuarios", uid), (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          postsMap[uid] = (d.posts || []).map((p) => ({
            autorId: uid,
            autorNome: d.nome || d.displayName || "Pescador",
            autorFoto: d.fotoPerfil || "",
            autorUsername: d.username || "",
            ...p,
          }));
        } else {
          postsMap[uid] = [];
        }
        recalcFeed();
      });
    };

    // Assina o próprio usuário para manter usuarioDados atualizado
    const mainUnsub = onSnapshot(doc(db, "usuarios", user.uid), (snap) => {
      if (!snap.exists()) return;
      setUsuarioDados(snap.data());
    });

    // Assina a coleção inteira de usuários para capturar todos os posts
    const colUnsub = onSnapshot(collection(db, "usuarios"), (snapshot) => {
      snapshot.docs.forEach((docSnap) => {
        subscribeToUser(docSnap.id, docSnap.data());
      });
    });

    return () => {
      mainUnsub?.();
      colUnsub?.();
      Object.values(secondaryUnsubs).forEach((fn) => fn());
    };
  }, [user]);

  /* ── Dark mode ── */
  useEffect(() => {
    if (localStorage.getItem("theme") === "dark") {
      document.body.classList.add("dark-mode");
    }
  }, []);

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useLayoutEffect(() => {
    if (feedLoading) return;
    if (scrollRestorado.current) return;

    scrollRestorado.current = true;

    const savedScroll = sessionStorage.getItem("home_scroll");
    if (!savedScroll) {
      setFeedPronto(true);
      return;
    }

    sessionStorage.removeItem("home_scroll");

    // Garante que o scroll aconteça após qualquer pintura pendente
    requestAnimationFrame(() => {
      window.scrollTo({
        top: Number(savedScroll),
        behavior: "instant", // ← força imediato, sem animação
      });
      setFeedPronto(true);
    });
  }, [feedLoading, feedPosts]);

  /* ── Shadow na sticky bar ao scroll ── */
  useEffect(() => {
    const handle = () => {
      const stickyBar = document.querySelector(".sticky-post-bar");
      stickyBar?.classList.toggle("scrolled", window.scrollY > 10);
    };
    window.addEventListener("scroll", handle, { passive: true });
    return () => window.removeEventListener("scroll", handle);
  }, []);

  /* ─────────────────────────────────────────
     Ações do feed
  ───────────────────────────────────────── */

  const curtirPost = useCallback(
    async (post) => {
      if (!user || !post.autorId) return;

      const jaCurtiu = (post.curtidas || []).includes(user.uid);

      setFeedPosts((prev) =>
        prev.map((p) => {
          if (p.id !== post.id || p.autorId !== post.autorId) return p;
          return {
            ...p,
            curtidas: jaCurtiu
              ? (p.curtidas || []).filter((id) => id !== user.uid)
              : [...(p.curtidas || []), user.uid],
          };
        }),
      );

      try {
        const ref = doc(db, "usuarios", post.autorId);
        await runTransaction(db, async (tx) => {
          const snap = await tx.get(ref);
          if (!snap.exists()) return;
          const atualizados = snap.data().posts.map((p) => {
            if (p.id !== post.id) return p;
            const curtidas = p.curtidas || [];
            return {
              ...p,
              curtidas: jaCurtiu
                ? curtidas.filter((id) => id !== user.uid)
                : [...curtidas, user.uid],
            };
          });
          tx.update(ref, { posts: atualizados });
        });
      } catch (e) {
        console.error("Erro ao curtir:", e);
        setFeedPosts((prev) =>
          prev.map((p) => {
            if (p.id !== post.id || p.autorId !== post.autorId) return p;
            return {
              ...p,
              curtidas: jaCurtiu
                ? [...(p.curtidas || []), user.uid]
                : (p.curtidas || []).filter((id) => id !== user.uid),
            };
          }),
        );
      }
    },
    [user],
  );

  const adicionarComentario = useCallback(
    async (post, texto) => {
      if (!texto?.trim() || !user || !post.autorId) return;

      const novoComentario = {
        id: Date.now(),
        autorId: user.uid,
        autorNome: usuarioDados?.nome || user.displayName || "Você",
        autorFoto: usuarioDados?.fotoPerfil || user.photoURL || "",
        texto: texto.trim(),
        data: new Date().toLocaleString("pt-BR"),
      };

      setFeedPosts((prev) =>
        prev.map((p) => {
          if (p.id !== post.id || p.autorId !== post.autorId) return p;
          return {
            ...p,
            comentarios: [...(p.comentarios || []), novoComentario],
          };
        }),
      );

      try {
        const ref = doc(db, "usuarios", post.autorId);
        await runTransaction(db, async (tx) => {
          const snap = await tx.get(ref);
          if (!snap.exists()) return;
          const atualizados = snap.data().posts.map((p) => {
            if (p.id !== post.id) return p;
            return {
              ...p,
              comentarios: [...(p.comentarios || []), novoComentario],
            };
          });
          tx.update(ref, { posts: atualizados });
        });
      } catch (e) {
        console.error("Erro ao comentar:", e);
        setFeedPosts((prev) =>
          prev.map((p) => {
            if (p.id !== post.id || p.autorId !== post.autorId) return p;
            return {
              ...p,
              comentarios: (p.comentarios || []).filter(
                (c) => c.id !== novoComentario.id,
              ),
            };
          }),
        );
      }
    },
    [user, usuarioDados],
  );

  const verPerfil = useCallback(
    (autorId) => navigate(`/perfil/${autorId}`),
    [navigate],
  );

  const verPost = useCallback(
    (autorId, postId) => {
      sessionStorage.setItem("home_scroll", String(window.scrollY));
      navigate(`/post/${autorId}/${postId}`);
    },
    [navigate],
  );

  /* ── Carrossel ── */
  /* A API pode devolver uma quantidade diferente da reserva local. Se o
   * índice atual ficar fora da nova lista, o carrossel aponta para um
   * item que não existe, então ele volta ao começo. */
  useEffect(() => {
    if (eventoIndex >= eventos.length) setEventoIndex(0);
  }, [eventos.length, eventoIndex]);

  useEffect(() => {
    if (localIndex >= locais.length) setLocalIndex(0);
  }, [locais.length, localIndex]);

  const prevEvento = () =>
    setEventoIndex((i) => (i - 1 + eventos.length) % eventos.length);
  const nextEvento = () => setEventoIndex((i) => (i + 1) % eventos.length);
  const prevLocal = () =>
    setLocalIndex((i) => (i - 1 + locais.length) % locais.length);
  const nextLocal = () => setLocalIndex((i) => (i + 1) % locais.length);

  const tabs = [
    { id: "para-voce", label: "Para você", icon: "stars" },
    { id: "seguindo", label: "Seguindo", icon: "group" },
    { id: "eventos", label: "Eventos", icon: "event" },
    { id: "locais", label: "Locais", icon: "pin_drop" },
    { id: "dicas", label: "Dicas", icon: "lightbulb" },
  ];

  const renderFeed = (posts) =>
    posts.map((post) => (
      <PostCard
        key={`${post.autorId}-${post.id}`}
        post={post}
        user={user}
        usuarioDados={usuarioDados}
        onCurtir={curtirPost}
        onComentar={adicionarComentario}
        onVerPerfil={verPerfil}
        onVerPost={verPost}
      />
    ));

  const feedStyle = {
    opacity: feedPronto ? 1 : 0,
    transition: feedPronto ? "opacity 0.15s ease" : "none",
  };

  /* ── JSX principal ── */
  return (
    <Layout>
      {/* O feed exige login: noindex para o buscador não indexar a tela de
          carregamento que ele receberia. */}
      <Seo
        titulo="Feed"
        descricao="Acompanhe publicações, torneios e pesqueiros em destaque."
        indexar={false}
      />

      <div className="column">
        {/* ── Sticky bar ── */}
        <div className="sticky-post-bar" ref={stickyRef}>
          <div
            className="btn-new-post"
            onClick={() => navigate("/publicar", { state: { from: "/home" } })}
            role="button"
            tabIndex={0}
            onKeyDown={(e) =>
              e.key === "Enter" &&
              navigate("/publicar", { state: { from: "/home" } })
            }
            aria-label="Nova publicação"
          >
            {usuarioDados?.fotoPerfil ? (
              <img
                src={usuarioDados.fotoPerfil}
                alt="Você"
                className="post-author-img"
              />
            ) : (
              <AvatarInicial nome={usuarioDados?.nome} size="md" />
            )}
            <input
              type="text"
              placeholder="O que você deseja publicar hoje?"
              readOnly
              tabIndex={-1}
            />
            <button className="post-btn" title="Nova publicação" tabIndex={-1}>
              <span className="material-symbols-outlined">
                add_photo_alternate
              </span>
            </button>
          </div>
        </div>

        <main
          className="main-content"
          /* De onde veio o catálogo: "api" ou "reserva". Visível no
             inspetor, útil para conferir se a API respondeu. */
          data-catalogo={origemCatalogo}
          style={{
            paddingTop: stickyHeight ? `${stickyHeight + 8}px` : undefined,
          }}
        >
          {/* ── Tabs ── */}
          <nav className="feed-tabs" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`feed-tab ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => {
                  setActiveTab(tab.id);
                  /* Qual aba o pescador abre mais: dado de produto que o
                     GA4 responde, e o Firebase não. */
                  registrarEvento("selecionar_aba_feed", { aba: tab.id });
                }}
              >
                <span className="material-symbols-outlined">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>

          {/* ── Conteúdo das tabs ── */}
          <div className="tab-content">
            {/* Para você */}
            {activeTab === "para-voce" && (
              <div className="content-layout">
                <section
                  className="feed"
                  aria-label="Feed para você"
                  style={feedStyle}
                >
                  {feedLoading ? (
                    <>
                      <PostCardSkeleton />
                      <PostCardSkeleton />
                      <PostCardSkeleton />
                    </>
                  ) : feedPosts.length === 0 ? (
                    <div className="empty-tab-hint">
                      <span className="material-symbols-outlined">water</span>
                      <p>
                        Nenhuma publicação ainda. Siga outros pescadores ou
                        publique algo!
                      </p>
                    </div>
                  ) : (
                    renderFeed(feedPosts)
                  )}
                </section>
              </div>
            )}

            {/* Seguindo */}
            {activeTab === "seguindo" && (
              <div className="content-layout">
                <section
                  className="feed"
                  aria-label="Feed seguindo"
                  style={feedStyle}
                >
                  {feedLoading ? (
                    <>
                      <PostCardSkeleton />
                      <PostCardSkeleton />
                      <PostCardSkeleton />
                    </>
                  ) : (
                    (() => {
                      const seguindo = usuarioDados?.seguindo || [];
                      const postsSeguindo = feedPosts.filter(
                        (p) =>
                          p.autorId !== user?.uid &&
                          seguindo.includes(p.autorId),
                      );
                      return postsSeguindo.length === 0 ? (
                        <div className="empty-tab-hint">
                          <span className="material-symbols-outlined">
                            group
                          </span>
                          <p>
                            Siga outros pescadores para ver as publicações deles
                            aqui.
                          </p>
                        </div>
                      ) : (
                        renderFeed(postsSeguindo)
                      );
                    })()
                  )}
                </section>
              </div>
            )}

            {/* Eventos */}
            {activeTab === "eventos" && (
              <div className="carousel-section">
                <div className="carousel-header">
                  <h2 className="section-title">
                    <span className="material-symbols-outlined">event</span>
                    Próximos Eventos
                  </h2>
                  <div className="carousel-controls">
                    <button
                      className="carousel-btn"
                      onClick={prevEvento}
                      aria-label="Evento anterior"
                    >
                      <span className="material-symbols-outlined">
                        chevron_left
                      </span>
                    </button>
                    <span className="carousel-counter">
                      {eventoIndex + 1} / {eventos.length}
                    </span>
                    <button
                      className="carousel-btn"
                      onClick={nextEvento}
                      aria-label="Próximo evento"
                    >
                      <span className="material-symbols-outlined">
                        chevron_right
                      </span>
                    </button>
                  </div>
                </div>
                <div className="carousel-track">
                  {eventos.map((evento, i) => (
                    <div
                      key={i}
                      className={`carousel-card evento-card ${
                        i === eventoIndex
                          ? "active"
                          : i ===
                              (eventoIndex - 1 + eventos.length) %
                                eventos.length
                            ? "prev"
                            : "next"
                      }`}
                    >
                      <div className="carousel-card-image">
                        <img src={evento.imagem} alt={evento.titulo} />
                        <span className="evento-date-badge">{evento.data}</span>
                      </div>
                      <div className="carousel-card-body">
                        <h3>{evento.titulo}</h3>
                        <p className="carousel-local">
                          <span className="material-symbols-outlined">
                            pin_drop
                          </span>
                          {evento.local}
                        </p>
                        <p className="carousel-desc">{evento.descricao}</p>
                        <button className="event-btn">Participar</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="carousel-dots">
                  {eventos.map((_, i) => (
                    <button
                      key={i}
                      className={`dot ${i === eventoIndex ? "active" : ""}`}
                      onClick={() => setEventoIndex(i)}
                      aria-label={`Ir para evento ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Locais */}
            {activeTab === "locais" && (
              <div className="carousel-section">
                <div className="carousel-header">
                  <h2 className="section-title">
                    <span className="material-symbols-outlined">
                      trending_up
                    </span>
                    Locais Mais Avaliados
                  </h2>
                  <div className="carousel-controls">
                    <button
                      className="carousel-btn"
                      onClick={prevLocal}
                      aria-label="Local anterior"
                    >
                      <span className="material-symbols-outlined">
                        chevron_left
                      </span>
                    </button>
                    <span className="carousel-counter">
                      {localIndex + 1} / {locais.length}
                    </span>
                    <button
                      className="carousel-btn"
                      onClick={nextLocal}
                      aria-label="Próximo local"
                    >
                      <span className="material-symbols-outlined">
                        chevron_right
                      </span>
                    </button>
                  </div>
                </div>
                <div className="carousel-track">
                  {locais.map((local, i) => (
                    <div
                      key={i}
                      className={`carousel-card local-card ${
                        i === localIndex
                          ? "active"
                          : i ===
                              (localIndex - 1 + locais.length) % locais.length
                            ? "prev"
                            : "next"
                      }`}
                    >
                      <div className="carousel-card-image">
                        <img src={local.imagem} alt={local.nome} />
                      </div>
                      <div className="carousel-card-body">
                        <h3>{local.nome}</h3>
                        <p className="carousel-local">
                          <span className="material-symbols-outlined">
                            location_on
                          </span>
                          {local.cidade}
                        </p>
                        <div className="place-rating-large">
                          <span className="rating-num">{local.avaliacao}</span>
                          <span className="stars">⭐⭐⭐⭐⭐</span>
                          <span className="rating-count">
                            ({local.avaliacoes} avaliações)
                          </span>
                        </div>
                        <button className="event-btn">Ver local</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="carousel-dots">
                  {locais.map((_, i) => (
                    <button
                      key={i}
                      className={`dot ${i === localIndex ? "active" : ""}`}
                      onClick={() => setLocalIndex(i)}
                      aria-label={`Ir para local ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Dicas */}
            {activeTab === "dicas" && (
              <div className="content-layout">
                <div className="dicas-container">
                  <div className="clima-card">
                    <div className="clima-header">
                      <span className="material-symbols-outlined">
                        wb_sunny
                      </span>
                      <h3>Clima Agora</h3>
                    </div>
                    <div className="clima-temp">28°C</div>
                    <div className="clima-desc">
                      Ensolarado · Condições ótimas para pesca
                    </div>
                    <div className="clima-detalhes">
                      <span>🌬️ Vento: 12 km/h</span>
                      <span>💧 Umidade: 65%</span>
                      <span>🎣 Melhor período: 06h - 10h</span>
                    </div>
                  </div>
                  <div className="dica-card">
                    <div className="dica-header">
                      <span className="material-symbols-outlined">
                        Phishing
                      </span>
                      <h3>Dica do dia</h3>
                    </div>
                    <p className="dica-texto">
                      Tucunaré ataca melhor com isca artificial de manhã. Use
                      cores vibrantes em dias ensolarados.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </Layout>
  );
};

export default Home;