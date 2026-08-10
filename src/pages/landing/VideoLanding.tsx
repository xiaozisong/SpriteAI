import { useCallback, useEffect, useState } from 'react'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'

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
  { label: '生成流程', target: 'workflow' },
  { label: '核心能力', target: 'solutions' },
  { label: '开始生成', target: 'start' },
]

const flowSteps = [
  { id: '01', icon: '⌕', title: '描述角色', desc: '定义风格、姿势与画面规格' },
  { id: '02', icon: 'spark', title: '生成与迭代', desc: '将灵感转成像素级素材' },
  { id: '03', icon: '▤', title: '导出与使用', desc: '将精灵图带入你的游戏' },
]

const solutionItems = [
  { title: '风格始终一致', desc: '围绕同一个角色设定，持续生成统一的视觉语言。' },
  { title: '动作自然延展', desc: '从站立到攻击、移动，让角色动作连续成组。' },
  { title: '素材立即可用', desc: '把生成结果带入原型、关卡和你的下一次迭代。' },
]

const problemFloaters = [
  { label: '风格漂移', x: '28%', y: '28%', delay: 0 },
  { label: '动作断裂', x: '68%', y: '32%', delay: 0.35 },
  { label: '规格不符', x: '36%', y: '68%', delay: 0.7 },
  { label: '沟通往返', x: '64%', y: '66%', delay: 1.05 },
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

function SparkMark({ size = 24 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2.5c.7 5.1 3.4 8.3 8.5 9.5-5.1.8-8.1 3.8-8.5 9.5C11.2 16.4 8.2 13.4 3 12c5.1-1.2 8.1-4.4 9-9.5Z" fill="currentColor" />
    </svg>
  )
}

export function VideoLanding({
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
        <div className="video-landing-hero-circuit" aria-hidden="true">
          <i /><i /><i /><i />
          <span /><span />
          <b className="video-landing-circuit-pulse video-landing-circuit-pulse-left" />
          <b className="video-landing-circuit-pulse video-landing-circuit-pulse-right" />
        </div>

        <motion.div
          className="video-landing-core"
          initial={reduceMotion ? false : { opacity: 0, scale: 0.82 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.08 }}
        >
          <span className="video-landing-core-grid" />
          <span className="video-landing-core-scan" aria-hidden="true" />
          <SparkMark size={38} />
        </motion.div>

        <motion.div
          className="video-landing-hero-copy"
          initial={reveal}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.75, ease: 'easeOut', delay: 0.28 }}
        >
          <p>AI 2D GAME ASSET STUDIO</p>
          <h1>把你的想法<br />变成游戏精灵图。</h1>
          <span>从一句描述开始，精灵为你生成角色、动作和可直接投入创作的 2D 游戏素材。</span>
          <button type="button" className="video-landing-cta" disabled={isCreatingWork} onClick={() => void onCreateWorkspace()}>
            开始生成精灵图 <b>↗</b>
          </button>
        </motion.div>

        <motion.div
          className="video-landing-entry-points"
          initial={reveal}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.65, ease: 'easeOut', delay: 0.48 }}
        >
          <span>开始生成</span>
          <button type="button" onClick={() => void onCreateDocument()}><i>⌕</i>角色精灵</button>
          <button type="button" onClick={() => void onCreateScript()}><i>⌁</i>动作序列</button>
          <button type="button" onClick={() => void onCreateWorkspace()}><i>↗</i>场景素材</button>
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
          <h2>从描述到精灵图，<em>每一步都可控。</em></h2>
        </motion.div>

        <div className="video-landing-flow">
          {flowSteps.map((step, index) => (
            <motion.article
              key={step.id}
              initial={softReveal}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.55, delay: reduceMotion ? 0 : 0.12 + index * 0.14 }}
            >
              <span>{step.id}</span>
              <i>{step.icon === 'spark' ? <SparkMark size={20} /> : step.icon}</i>
              <strong>{step.title}</strong>
              <p>{step.desc}</p>
            </motion.article>
          )).flatMap((node, index, list) => (
            index < list.length - 1
              ? [node, (
                <motion.b
                  key={`connector-${index}`}
                  aria-hidden="true"
                  className="video-landing-flow-line"
                  initial={reduceMotion ? false : { scaleX: 0, opacity: 0 }}
                  whileInView={{ scaleX: 1, opacity: 1 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.7, delay: reduceMotion ? 0 : 0.28 + index * 0.16, ease: 'easeOut' }}
                />
              )]
              : [node]
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
          <h2>游戏构想很清晰，<em>素材生产却很慢。</em></h2>
          <span>角色、动作与场景需要反复沟通和制作。灵感不该停在草稿里，而应快速成为可用资产。</span>
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
              style={{ left: item.x, top: item.y }}
              initial={reduceMotion ? false : { opacity: 0, scale: 0.7 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.55, delay: reduceMotion ? 0 : 0.2 + item.delay }}
              animate={reduceMotion ? undefined : {
                y: [0, -7, 0],
                transition: { duration: 3.6, repeat: Infinity, ease: 'easeInOut', delay: item.delay },
              }}
            >
              <i /><span>{item.label}</span>
            </motion.div>
          ))}

          <div className="video-landing-problem-node">
            <SparkMark size={28} />
            <span>素材断层</span>
          </div>
          <div className="video-landing-problem-steps" aria-hidden="true">
            <i /><i className="is-active" /><i />
          </div>
        </motion.div>
      </section>

      <section id="solutions" className="video-landing-solutions">
        <div className="video-landing-solution-particles" aria-hidden="true">
          {solutionParticles.map((particle, index) => (
            <motion.i
              key={index}
              style={{
                left: particle.x,
                top: particle.y,
                width: particle.size,
                height: particle.size,
              }}
              initial={reduceMotion ? false : { opacity: 0, scale: 0.4 }}
              whileInView={{ opacity: 0.9, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.8, delay: reduceMotion ? 0 : particle.delay }}
              animate={reduceMotion ? undefined : {
                y: [0, -10, 0],
                opacity: [0.45, 0.95, 0.45],
                transition: { duration: 4.2 + (index % 3) * 0.35, repeat: Infinity, ease: 'easeInOut', delay: particle.delay },
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
          <h2>让游戏素材<br /><em>持续生长。</em></h2>
        </motion.div>

        <motion.div
          className="video-landing-solution-panel"
          initial={reduceMotion ? false : { opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.75 }}
        >
          <div>
            <strong>可用</strong>
            <span>为 2D 游戏创作而生</span>
          </div>

          <div className="video-landing-solution-track" aria-hidden="true">
            {solutionItems.map((_, index) => (
              <button
                key={index}
                type="button"
                className={index === activeSolution ? 'is-active' : undefined}
                onClick={() => setActiveSolution(index)}
                aria-label={`切换到能力 ${index + 1}`}
              />
            ))}
          </div>

          <ol>
            {solutionItems.map((item, index) => {
              const isActive = index === activeSolution
              return (
                <li key={item.title} className={isActive ? 'is-active' : undefined}>
                  <i />
                  <section>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`${item.title}-${isActive ? 'on' : 'off'}`}
                        initial={reduceMotion || !isActive ? false : { opacity: 0.55, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35 }}
                      >
                        <b>{item.title}</b>
                        <span>{item.desc}</span>
                      </motion.div>
                    </AnimatePresence>
                  </section>
                </li>
              )
            })}
          </ol>
        </motion.div>
      </section>

      <section id="start" className="video-landing-final">
        <motion.div
          initial={reveal}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7 }}
        >
          <SparkMark size={30} />
          <h2>把下一个游戏角色，<br />交给精灵。</h2>
          <p>从一句描述，开始生成你的 2D 游戏世界。</p>
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
