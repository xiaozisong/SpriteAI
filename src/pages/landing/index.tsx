import { useCallback, useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { createWorkReq } from '@/api/works'
import { openLoginDialog } from '@/components/LoginDialog'
import { trackEvent } from '@/matomo/trackingMatomoEvent'
import { useLoginStore } from '@/stores/loginStore'
import './landing.css'

interface VideoLandingProps {
  isLoggedIn: boolean
  isCreatingWork: boolean
  onLogin: () => void
  onCreateDocument: () => Promise<void>
  onCreateScript: () => Promise<void>
  onCreateWorkspace: () => Promise<void>
}

const navItems = [
  { label: '总览', target: 'overview' },
  { label: '创作流程', target: 'workflow' },
  { label: '素材能力', target: 'solutions' },
  { label: '启动生成', target: 'start' },
]

const flowSteps = [
  { id: '01', icon: '⌕', title: '设定角色', desc: '输入职业、风格、视角与画布规格' },
  { id: '02', icon: 'spark', title: '补全动作帧', desc: '让 Agent 扩写跑跳攻击等连续姿态' },
  { id: '03', icon: '▤', title: '导出素材包', desc: '得到可放进引擎的精灵图与透明底资源' },
]

const solutionItems = [
  { title: '角色风格锁定', desc: '围绕同一套提示词与参考设定，持续生成统一角色资产。' },
  { title: '动作帧自动延展', desc: '从待机到攻击、移动、受击，让精灵动作自然成组。' },
  { title: '规格面向游戏引擎', desc: '透明背景、序列帧与场景元素，都能快速带入原型。' },
]

const problemFloaters = [
  { label: '风格漂移', x: '27%', y: '27%', delay: 0 },
  { label: '动作缺帧', x: '70%', y: '31%', delay: 0.35 },
  { label: '透明底返工', x: '34%', y: '70%', delay: 0.7 },
  { label: '素材等太久', x: '66%', y: '67%', delay: 1.05 },
]

const solutionParticles = [
  { x: '12%', y: '18%', size: 11, delay: 0 },
  { x: '22%', y: '34%', size: 7, delay: 0.2 },
  { x: '8%', y: '72%', size: 9, delay: 0.4 },
  { x: '18%', y: '58%', size: 5, delay: 0.55 },
  { x: '88%', y: '20%', size: 10, delay: 0.15 },
  { x: '78%', y: '36%', size: 6, delay: 0.35 },
  { x: '92%', y: '68%', size: 8, delay: 0.5 },
  { x: '82%', y: '78%', size: 5, delay: 0.7 },
  { x: '30%', y: '12%', size: 4, delay: 0.25 },
  { x: '70%', y: '14%', size: 4, delay: 0.45 },
  { x: '32%', y: '86%', size: 5, delay: 0.6 },
  { x: '68%', y: '88%', size: 6, delay: 0.8 },
]

const assetCards = [
  { label: 'idle_04', kind: '待机帧' },
  { label: 'run_08', kind: '奔跑帧' },
  { label: 'slash_03', kind: '攻击帧' },
]

const statPills = ['32x32', '透明底', '动作组']

function PixelSprite() {
  return (
    <div className="video-landing-pixel-sprite" aria-hidden="true">
      <span className="video-landing-pixel-ear video-landing-pixel-ear-left" />
      <span className="video-landing-pixel-ear video-landing-pixel-ear-right" />
      <span className="video-landing-pixel-head">
        <i className="video-landing-pixel-eye video-landing-pixel-eye-left" />
        <i className="video-landing-pixel-eye video-landing-pixel-eye-right" />
        <b />
      </span>
      <span className="video-landing-pixel-body" />
      <span className="video-landing-pixel-shadow" />
    </div>
  )
}

function SparkMark({ size = 24 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2.5c.7 5.1 3.4 8.3 8.5 9.5-5.1.8-8.1 3.8-8.5 9.5C11.2 16.4 8.2 13.4 3 12c5.1-1.2 8.1-4.4 9-9.5Z" fill="currentColor" />
    </svg>
  )
}

function VideoLanding({
  isLoggedIn,
  isCreatingWork,
  onLogin,
  onCreateDocument,
  onCreateScript,
  onCreateWorkspace,
}: VideoLandingProps) {
  const reduceMotion = useReducedMotion()
  const [activeNav, setActiveNav] = useState('overview')
  const [activeSolution, setActiveSolution] = useState(1)

  const scrollTo = useCallback((target: string) => {
    document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  useEffect(() => {
    const sectionIds = ['overview', 'workflow', 'solutions', 'start']
    const nodes = sectionIds
      .map((id) => document.getElementById(id))
      .filter((node): node is HTMLElement => Boolean(node))

    if (!nodes.length) return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible?.target?.id) setActiveNav(visible.target.id)
      },
      { root: null, threshold: [0.25, 0.45, 0.65], rootMargin: '-18% 0px -42% 0px' },
    )

    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (reduceMotion) return undefined
    const timer = window.setInterval(() => {
      setActiveSolution((prev) => (prev + 1) % solutionItems.length)
    }, 3200)
    return () => window.clearInterval(timer)
  }, [reduceMotion])

  const reveal = reduceMotion ? false : { opacity: 0, y: 22, filter: 'blur(8px)' }
  const softReveal = reduceMotion ? false : { opacity: 0, y: 18 }

  return (
    <main className="video-landing">
      <motion.header
        className="video-landing-nav"
        initial={reduceMotion ? false : { opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <button type="button" className="video-landing-brand" onClick={() => scrollTo('overview')} aria-label="精灵首页">
          <SparkMark size={20} /><span>精灵</span>
        </button>
        <nav aria-label="官网导航">
          {navItems.map((item) => (
            <button
              key={item.target}
              type="button"
              className={activeNav === item.target ? 'is-active' : undefined}
              onClick={() => scrollTo(item.target)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div>
          {!isLoggedIn && <button type="button" className="video-landing-login" onClick={onLogin}>登录</button>}
          <button type="button" className="video-landing-cta" disabled={isCreatingWork} onClick={() => void onCreateWorkspace()}>开始生成 <span>↗</span></button>
        </div>
      </motion.header>

      <section id="overview" className="video-landing-hero">

        <motion.div
          className="video-landing-hero-copy"
          initial={reveal}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.75, ease: 'easeOut', delay: 0.28 }}
        >
          <h1 className="video-landing-typewriter">
            <span className="video-landing-typewriter-text">精灵生产<em>精灵</em></span>
          </h1>
          <span>输入一句想法，让 Agent 为你生成角色精灵、动作帧和可直接投入原型的素材包</span>
          <button type="button" className="video-landing-cta" disabled={isCreatingWork} onClick={() => void onCreateWorkspace()}>
            立即开始生成 <b>↗</b>
          </button>
        </motion.div>

        <motion.div
          className="video-landing-sprite-stage"
          initial={reduceMotion ? false : { opacity: 0, y: 34, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.72, ease: 'easeOut', delay: 0.56 }}
          aria-label="精灵图生成预览"
        >
          <div className="video-landing-stage-toolbar">
            <span>Sprite Lab</span>
            <div>{statPills.map((pill) => <i key={pill}>{pill}</i>)}</div>
          </div>
          <div className="video-landing-stage-canvas">
            <span className="video-landing-stage-scan" aria-hidden="true" />
            <PixelSprite />
          </div>
          <div className="video-landing-asset-strip">
            {assetCards.map((card, index) => (
              <article key={card.label} style={{ animationDelay: `${index * 0.16}s` }}>
                <span>{card.kind}</span>
                <strong>{card.label}</strong>
              </article>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="video-landing-entry-points"
          initial={reveal}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.65, ease: 'easeOut', delay: 0.48 }}
        >
          <span>选择生成入口</span>
          <button type="button" onClick={() => void onCreateDocument()}><i>⌕</i>角色精灵</button>
          <button type="button" onClick={() => void onCreateScript()}><i>⌁</i>动作帧组</button>
          <button type="button" onClick={() => void onCreateWorkspace()}><i>↗</i>完整素材包</button>
        </motion.div>

        <div className="video-landing-hero-arc video-landing-hero-arc-one" aria-hidden="true" />
        <div className="video-landing-hero-arc video-landing-hero-arc-two" aria-hidden="true" />
      </section>

      <section id="workflow" className="video-landing-verify">
        <motion.div
          initial={reveal}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.65 }}
        >
          <p className="video-landing-label">生成流程</p>
          <h2>从提示词到精灵图，<em>像组装一套技能。</em></h2>
        </motion.div>

        <div className="video-landing-flow">
          {flowSteps.map((step, index) => (
            <div key={step.id} className="video-landing-flow-item">
              <motion.article
                initial={softReveal}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.55, delay: reduceMotion ? 0 : 0.12 + index * 0.14 }}
              >
                <span>{step.id}</span>
                <strong>{step.title}</strong>
                <p>{step.desc}</p>
              </motion.article>
              {index < flowSteps.length - 1 && (
                <motion.b
                  aria-hidden="true"
                  className="video-landing-flow-line"
                  initial={reduceMotion ? false : { opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.7, delay: reduceMotion ? 0 : 0.28 + index * 0.16, ease: 'easeOut' }}
                />
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="video-landing-problem">
        <motion.div
          className="video-landing-problem-copy"
          initial={reveal}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.65 }}
        >
          <p className="video-landing-label">创作阻力</p>
          <h2>玩法已经成型，<em>素材却卡住节奏?</em></h2>
          <span>角色、动作与场景小物常常需要反复沟通。让 Agent 接住灵感，把草稿快速推成可用资产</span>
        </motion.div>

        <motion.div
          className="video-landing-problem-visual"
          initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.75 }}
        >
          <div className="video-landing-orb video-landing-orb-left" />
          <div className="video-landing-orb video-landing-orb-right" />

          {problemFloaters.map((item) => (
            <motion.div
              key={item.label}
              className="video-landing-problem-floater"
              style={{ left: item.x, top: item.y, animationDelay: `${item.delay}s` }}
              initial={reduceMotion ? false : { opacity: 0, scale: 0.7 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.55, delay: reduceMotion ? 0 : 0.2 + item.delay }}
            >
              <i /><span>{item.label}</span>
            </motion.div>
          ))}

          <div className="video-landing-problem-node">
            <SparkMark size={28} />
            <span>素材瓶颈</span>
          </div>
          <div className="video-landing-problem-steps" aria-hidden="true">
            <i /><i className="is-active" /><i />
          </div>
        </motion.div>
      </section>

      <section id="solutions" className="video-landing-solutions">
        <div className="video-landing-solution-particles" aria-hidden="true">
          {solutionParticles.map((particle, index) => (
            <i
              key={index}
              style={{
                left: particle.x,
                top: particle.y,
                width: particle.size,
                height: particle.size,
                animationDelay: `${particle.delay}s`,
              }}
            />
          ))}
        </div>

        <motion.div
          initial={reveal}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.7 }}
        >
          <p className="video-landing-label">精灵生成引擎</p>
          <h2>让每次生成<br /><em>都更接近游戏资产</em></h2>
        </motion.div>

        <motion.div
          className="video-landing-solution-panel"
          initial={reduceMotion ? false : { opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.75 }}
        >
          <div className="video-landing-production-video">
            <video
              className="video-landing-process-video"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-label="生成流程视频预留位"
            />
            <div className="video-landing-video-placeholder">
              <span>Generation pipeline</span>
              <strong>生成流程视频</strong>
              <p>后续可接入角色设定、动作帧生成和素材包导出的完整演示视频。</p>
            </div>
          </div>

          <div className="video-landing-production-copy">
            <strong>Production stack</strong>
            <span>从提示词到可交付素材的生产链路</span>
            <ol>
            {solutionItems.map((item, index) => {
              const isActive = index === activeSolution
              return (
                <li key={item.title} className={isActive ? 'is-active' : undefined}>
                  <button type="button" onClick={() => setActiveSolution(index)}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <section>
                    <b>{item.title}</b>
                    <span>{item.desc}</span>
                  </section>
                  </button>
                </li>
              )
            })}
            </ol>
          </div>
        </motion.div>
      </section>

      <section id="start" className="video-landing-final">
        <motion.div
          initial={reveal}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7 }}
        >
          <h2>让下一个角色，<br />从紫色生成舱里醒来</h2>
          <p>从一句描述，开始搭建你的 2D 游戏世界</p>
          <button type="button" className="video-landing-cta" disabled={isCreatingWork} onClick={() => void onCreateWorkspace()}>开始生成 <span>↗</span></button>
        </motion.div>
      </section>

      <footer className="video-landing-footer">
        <span><SparkMark size={17} />精灵</span>
        <p>AI 2D 游戏精灵图生成工具</p>
        <div>
          <a href="/user-agreement">服务协议</a>
          <a href="/privacy-policy">隐私政策</a>
        </div>
      </footer>
    </main>
  )
}

export default function LandingPage() {
  const navigate = useNavigate()
  const [isCreatingWork, setIsCreatingWork] = useState(false)

  const isLoggedIn = useLoginStore((state) => state.isLoggedIn)
  const requireLogin = useLoginStore((state) => state.requireLogin)

  const handleShowLogin = useCallback(async () => {
    try {
      await openLoginDialog()
    } catch {
      // 用户关闭登录弹窗时静默忽略
    }
  }, [])

  const addWork = useCallback(async () => {
    if (isCreatingWork) return

    try {
      setIsCreatingWork(true)
      const req = await createWorkReq('editor')
      if (!req?.id) return
      navigate(`/editor/${req.id}`)
    } catch {
      toast.error('创建作品失败，请稍后重试')
    } finally {
      setIsCreatingWork(false)
    }
  }, [isCreatingWork, navigate])

  const handleEditorClick = useCallback(async () => {
    trackEvent('Story Creation', 'Click', 'Common New from Landing')
    await requireLogin(() => addWork())
  }, [addWork, requireLogin])

  return (
    <VideoLanding
      isLoggedIn={isLoggedIn}
      isCreatingWork={isCreatingWork}
      onLogin={handleShowLogin}
      onCreateDocument={handleEditorClick}
      onCreateScript={handleEditorClick}
      onCreateWorkspace={handleEditorClick}
    />
  )
}
