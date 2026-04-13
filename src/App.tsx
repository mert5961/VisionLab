import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { PipelineCodeEditor } from './components/PipelineCodeEditor'
import { RelatedLessonCard } from './components/RelatedLessonCard'
import { SignalScreen } from './components/SignalScreen'
import { useFindShapeAnalysis } from './cv/useFindShapeAnalysis'
import {
  getMissionSetById,
  getPlayableLevelIdsForMissionSet,
  getPlayableMissionSetsForModule,
} from './game/catalog'
import { evaluateFindShapeLevelQa } from './qa/findShapeQa'
import { useUiQa } from './qa/useUiQa'
import { findShapeOperationHelp } from './modules/find-the-shape/help'
import { createFindShapeProgramCopy, resolveDefaultParameters } from './modules/find-the-shape/pipelineModel'
import { findShapeModule } from './modules/find-the-shape/module'
import type {
  FindShapeDisplayState,
  FindShapeOperationId,
  FindShapeProgram,
} from './modules/find-the-shape/types'

type ScreenMode = 'mission' | 'operator'

function isMissionSetComplete(
  missionSetId: string,
  completedLevelIds: string[],
  playableLevelIdsByMissionSet: Map<string, string[]>,
) {
  const playableLevelIds = playableLevelIdsByMissionSet.get(missionSetId) ?? []
  return playableLevelIds.length > 0 && playableLevelIds.every((levelId) => completedLevelIds.includes(levelId))
}

function getUnlockedMissionSetIds(
  missionSetIds: string[],
  completedLevelIds: string[],
  playableLevelIdsByMissionSet: Map<string, string[]>,
) {
  const unlockedMissionSetIds: string[] = []

  for (const missionSetId of missionSetIds) {
    if (
      unlockedMissionSetIds.length > 0 &&
      !isMissionSetComplete(
        unlockedMissionSetIds[unlockedMissionSetIds.length - 1],
        completedLevelIds,
        playableLevelIdsByMissionSet,
      )
    ) {
      break
    }

    unlockedMissionSetIds.push(missionSetId)
  }

  return unlockedMissionSetIds
}

function App() {
  const module = findShapeModule
  const levels = module.levels
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0)
  const [completedLevelIds, setCompletedLevelIds] = useState<string[]>([])
  const [screenMode, setScreenMode] = useState<ScreenMode>('mission')
  const [analysisOpen, setAnalysisOpen] = useState(false)
  const [screenFx, setScreenFx] = useState('')
  const [debugMode] = useState(
    () => new URLSearchParams(window.location.search).get('debug') === '1',
  )
  const currentLevel = levels[currentLevelIndex]

  const [program, setProgram] = useState<FindShapeProgram>(() =>
    createFindShapeProgramCopy(currentLevel.initialProgram),
  )
  const [seed, setSeed] = useState(currentLevel.sceneSeed)
  const [scene, setScene] = useState(() =>
    module.createScene(currentLevel.sceneSeed, currentLevel.sceneOptions),
  )
  const [initialAnalysis, setInitialAnalysis] = useState(() =>
    module.analyze(
      module.createScene(currentLevel.sceneSeed, currentLevel.sceneOptions),
      createFindShapeProgramCopy(currentLevel.initialProgram),
    ),
  )

  const shellRef = useRef<HTMLElement | null>(null)
  const operatorTopRef = useRef<HTMLElement | null>(null)
  const visualRef = useRef<HTMLElement | null>(null)
  const pipelineRef = useRef<HTMLDivElement | null>(null)

  const { analysis, isPending: isReprocessing } = useFindShapeAnalysis({
    scene,
    program,
    initialAnalysis,
  })
  const resolvedCompletedLevelIds = useMemo(
    () =>
      analysis.success && !completedLevelIds.includes(currentLevel.id)
        ? [...completedLevelIds, currentLevel.id]
        : completedLevelIds,
    [analysis.success, completedLevelIds, currentLevel.id],
  )

  const playableMissionSets = useMemo(
    () => getPlayableMissionSetsForModule('find-shape'),
    [],
  )
  const playableLevelIdsByMissionSet = useMemo(
    () =>
      new Map(
        playableMissionSets.map((missionSet) => [
          missionSet.id,
          getPlayableLevelIdsForMissionSet(missionSet),
        ]),
      ),
    [playableMissionSets],
  )
  const playableMissionSetIds = playableMissionSets.map((missionSet) => missionSet.id)
  const unlockedMissionSetIds = useMemo(
    () =>
      getUnlockedMissionSetIds(
        playableMissionSetIds,
        resolvedCompletedLevelIds,
        playableLevelIdsByMissionSet,
      ),
    [playableLevelIdsByMissionSet, playableMissionSetIds, resolvedCompletedLevelIds],
  )
  const unlockedLevelIds = useMemo(() => {
    const nextUnlockedIds = new Set<string>()

    for (const missionSetId of unlockedMissionSetIds) {
      const missionLevels = levels
        .filter((level) => level.missionSetId === missionSetId)
        .sort((left, right) => left.levelNumber - right.levelNumber)

      let canUnlockNextLevel = true

      for (const level of missionLevels) {
        if (resolvedCompletedLevelIds.includes(level.id)) {
          nextUnlockedIds.add(level.id)
          continue
        }

        if (canUnlockNextLevel) {
          nextUnlockedIds.add(level.id)
        }

        canUnlockNextLevel = false
      }
    }

    return nextUnlockedIds
  }, [levels, resolvedCompletedLevelIds, unlockedMissionSetIds])
  const currentMissionSet =
    getMissionSetById(currentLevel.missionSetId) ?? playableMissionSets[0] ?? null
  const focusedMissionSet =
    playableMissionSets.find(
      (missionSet) =>
        unlockedMissionSetIds.includes(missionSet.id) &&
        !isMissionSetComplete(
          missionSet.id,
          resolvedCompletedLevelIds,
          playableLevelIdsByMissionSet,
        ),
    ) ??
    currentMissionSet ??
    playableMissionSets[0] ??
    null
  const focusedMissionLevels = focusedMissionSet
    ? levels
        .filter((level) => level.missionSetId === focusedMissionSet.id)
        .sort((left, right) => left.levelNumber - right.levelNumber)
    : []
  const focusedLevel =
    focusedMissionLevels.find(
      (level) =>
        unlockedLevelIds.has(level.id) && !resolvedCompletedLevelIds.includes(level.id),
    ) ??
    focusedMissionLevels[focusedMissionLevels.length - 1] ??
    currentLevel
  const missionPreviewScene = module.createScene(
    focusedLevel.sceneSeed,
    focusedLevel.sceneOptions,
  )

  const gameplayQa = useMemo(
    () => evaluateFindShapeLevelQa({ level: currentLevel, module }),
    [currentLevel, module],
  )

  const uiQa = useUiQa({
    shellRef,
    missionRef: operatorTopRef,
    visualRef,
    pipelineRef,
    watchKey: [
      screenMode,
      analysisOpen ? 'analysis' : 'closed',
      currentLevel.id,
      analysis.systemState,
      analysis.primaryIssue,
      analysis.nextAction,
      Math.round(analysis.confidence * 100),
      program.steps.map((step) => `${step.id}:${step.functionId ?? 'none'}:${step.enabled}`).join('|'),
    ].join('::'),
  })

  useEffect(() => {
    if (!debugMode) {
      return
    }

    console.debug('[VisionLab]', {
      screenMode,
      analysisOpen,
      level: currentLevel.id,
      success: analysis.success,
      issue: analysis.primaryIssue,
      nextAction: analysis.nextAction,
      breakingStepId: analysis.breakingStepId,
      gameplayQa,
      uiQa,
    })
  }, [analysis, analysisOpen, currentLevel.id, debugMode, gameplayQa, screenMode, uiQa])

  useEffect(() => {
    if (!screenFx) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setScreenFx('')
    }, 420)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [screenFx])

  const triggerScreenFx = (fx: string) => {
    setScreenFx(fx)
  }

  const persistCurrentLevelCompletion = () => {
    if (!analysis.success) {
      return
    }

    setCompletedLevelIds((currentCompletedLevelIds) =>
      currentCompletedLevelIds.includes(currentLevel.id)
        ? currentCompletedLevelIds
        : [...currentCompletedLevelIds, currentLevel.id],
    )
  }

  const enterOperator = () => {
    persistCurrentLevelCompletion()

    if (focusedLevel.id !== currentLevel.id) {
      const nextScene = module.createScene(focusedLevel.sceneSeed, focusedLevel.sceneOptions)
      const nextProgram = createFindShapeProgramCopy(focusedLevel.initialProgram)

      setCurrentLevelIndex(levels.findIndex((level) => level.id === focusedLevel.id))
      setProgram(nextProgram)
      setSeed(focusedLevel.sceneSeed)
      setScene(nextScene)
      setInitialAnalysis(module.analyze(nextScene, nextProgram))
    }

    setScreenMode('operator')
    setAnalysisOpen(false)
    triggerScreenFx('app-shell--glitch')
  }

  const returnToMission = () => {
    setAnalysisOpen(false)
    setScreenMode('mission')
    triggerScreenFx('app-shell--dissolve')
  }

  const loadLevel = (levelId: string) => {
    const nextIndex = levels.findIndex((level) => level.id === levelId)

    if (nextIndex < 0 || !unlockedLevelIds.has(levelId)) {
      return
    }

    persistCurrentLevelCompletion()

    const level = levels[nextIndex]
    const nextProgram = createFindShapeProgramCopy(level.initialProgram)
    const nextScene = module.createScene(level.sceneSeed, level.sceneOptions)
    setCurrentLevelIndex(nextIndex)
    setProgram(nextProgram)
    setSeed(level.sceneSeed)
    setScene(nextScene)
    setInitialAnalysis(module.analyze(nextScene, nextProgram))
  }

  const moveStep = (stepId: string, direction: -1 | 1) => {
    setProgram((current) => {
      const next = createFindShapeProgramCopy(current)
      const index = next.steps.findIndex((step) => step.id === stepId)
      const targetIndex = index + direction

      if (
        index < 0 ||
        targetIndex < 0 ||
        targetIndex >= next.steps.length ||
        next.steps[index].locked ||
        next.steps[targetIndex].locked
      ) {
        return current
      }

      const [step] = next.steps.splice(index, 1)
      next.steps.splice(targetIndex, 0, step)
      return next
    })
  }

  const toggleStep = (stepId: string) => {
    setProgram((current) => {
      const next = createFindShapeProgramCopy(current)
      const step = next.steps.find((candidate) => candidate.id === stepId)

      if (!step || step.locked) {
        return current
      }

      step.enabled = !step.enabled
      return next
    })
  }

  const changeStepFunction = (stepId: string, functionId: FindShapeOperationId | null) => {
    setProgram((current) => {
      const next = createFindShapeProgramCopy(current)
      const step = next.steps.find((candidate) => candidate.id === stepId)

      if (!step || step.locked) {
        return current
      }

      const previousValues = { ...step.parameterValues }
      step.functionId = functionId
      step.parameterValues = functionId
        ? {
            ...resolveDefaultParameters(functionId),
            ...Object.fromEntries(
              Object.entries(previousValues).filter(([key]) => key in resolveDefaultParameters(functionId)),
            ),
          }
        : previousValues
      return next
    })
  }

  const changeParameter = (stepId: string, key: string, value: number) => {
    setProgram((current) => {
      const next = createFindShapeProgramCopy(current)
      const step = next.steps.find((candidate) => candidate.id === stepId)

      if (!step || step.locked) {
        return current
      }

      step.parameterValues[key] = value
      return next
    })
  }

  const toggleDisplay = (key: keyof FindShapeDisplayState, value: boolean) => {
    setProgram((current) => ({
      ...createFindShapeProgramCopy(current),
      display: {
        ...current.display,
        [key]: value,
      },
    }))
  }

  const resetProgram = () => {
    const nextProgram = createFindShapeProgramCopy(currentLevel.initialProgram)
    setProgram(nextProgram)
    setInitialAnalysis(module.analyze(scene, nextProgram))
  }

  const rescan = () => {
    const nextSeed = seed + 17
    const nextScene = module.createScene(nextSeed, currentLevel.sceneOptions)
    setSeed(nextSeed)
    setScene(nextScene)
    setInitialAnalysis(module.analyze(nextScene, program))
  }

  const questLabel = `Find ${scene.targetLabel}`
  const missionQuestLabel = `Find ${missionPreviewScene.targetLabel}`
  const missionSteps = focusedMissionLevels.map((level) => ({
    id: level.id,
    title: level.title,
    summary: level.shortGoal,
    unlocked: unlockedLevelIds.has(level.id),
    completed: resolvedCompletedLevelIds.includes(level.id),
    current: level.id === focusedLevel.id,
  }))
  const relatedLesson = currentMissionSet?.relatedLesson ?? currentLevel.relatedLesson ?? null

  return (
    <main className={`app-shell ${screenFx}`} ref={shellRef}>
      {screenMode === 'mission' ? (
        <section className="mission-screen">
          <div className="mission-screen__frame">
            <header className="mission-screen__header">
              <p className="mission-screen__eyebrow">
                {focusedMissionSet?.title ?? currentMissionSet?.title} /{' '}
                {focusedMissionSet?.lecture.rangeLabel ?? currentMissionSet?.lecture.rangeLabel}
              </p>
              <h1 className="mission-screen__title">{missionQuestLabel}</h1>
              <p className="mission-screen__subtitle">
                {focusedMissionSet?.summary ?? currentMissionSet?.summary}
              </p>
            </header>

            <section className="mission-screen__brief">
              <div className="mission-screen__brief-copy">
                <p className="mission-screen__label">Current Mission</p>
                <h2 className="mission-screen__mission-title">{focusedLevel.title}</h2>
                <p className="mission-screen__mission-copy">{focusedLevel.objective}</p>
              </div>
              <button
                type="button"
                className="mission-screen__start"
                onClick={enterOperator}
              >
                Start Operator Mode
              </button>
            </section>

            <section className="mission-screen__levels">
              <p className="mission-screen__label">Mission Steps</p>
              <div className="mission-step-list">
                {missionSteps.map((step) => (
                  <button
                    key={step.id}
                    type="button"
                    className={`mission-step ${step.current ? 'mission-step--current' : ''} ${step.completed ? 'mission-step--completed' : ''}`}
                    disabled={!step.unlocked}
                    onClick={() => loadLevel(step.id)}
                  >
                    <span className="mission-step__state">
                      {step.completed && !step.current ? '✓' : step.current ? '>' : '•'}
                    </span>
                    <span className="mission-step__text">
                      <span className="mission-step__title">{step.title}</span>
                      <span className="mission-step__summary">{step.summary}</span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        </section>
      ) : (
        <section className="operator-screen">
          <header className="operator-bar" ref={operatorTopRef}>
            <div className="operator-bar__meta">
              <button
                type="button"
                className="operator-bar__button"
                onClick={returnToMission}
              >
                Mission
              </button>
              <span className="operator-bar__label">
                {currentLevel.title} / {scene.targetCode}
              </span>
            </div>
            <p className="operator-bar__feedback">{analysis.nextAction}</p>
            <div className="operator-bar__actions">
              <span className={`operator-bar__state operator-bar__state--${analysis.systemState}`}>
                {isReprocessing ? 'updating' : analysis.systemState}
              </span>
              <button
                type="button"
                className="operator-bar__button"
                onClick={() => setAnalysisOpen((current) => !current)}
              >
                {analysisOpen ? 'Close Analysis' : 'Analysis'}
              </button>
            </div>
          </header>

          <section className="operator-stage">
            <section className="operator-visual" ref={visualRef}>
              <div className="operator-visual__header">
                <div>
                  <p className="operator-visual__eyebrow">Visual Area</p>
                  <h2 className="operator-visual__title">{questLabel}</h2>
                </div>
                <span className="operator-visual__status">{analysis.statusText}</span>
              </div>
              <div className="operator-visual__grid">
                <SignalScreen
                  title="Input"
                  kicker="Source"
                  note={scene.targetCode}
                  accent="cyan"
                  frame={scene.sourceFrame}
                />
                <SignalScreen
                  title="Processed"
                  kicker="Result"
                  note={analysis.success ? 'verified' : 'live'}
                  accent={analysis.success ? 'green' : 'amber'}
                  frame={analysis.processedFrame}
                />
                <div className="operator-visual__overlay">
                  <SignalScreen
                    title="Overlay"
                    kicker="Target Lock"
                    note={analysis.success ? 'stable' : 'tracking'}
                    accent={analysis.success ? 'green' : 'cyan'}
                    frame={analysis.overlayFrame}
                  />
                </div>
              </div>
            </section>

            <div className="operator-pipeline" ref={pipelineRef}>
              <PipelineCodeEditor
                program={program}
                lineReports={analysis.lineReports}
                operationCatalog={module.operationCatalog}
                helpCatalog={findShapeOperationHelp}
                relatedLesson={relatedLesson}
                isPending={isReprocessing}
                systemState={analysis.systemState}
                breakingStepId={analysis.breakingStepId}
                primaryIssue={analysis.primaryIssue}
                onMoveStep={moveStep}
                onToggleStep={toggleStep}
                onChangeFunction={changeStepFunction}
                onChangeParameter={changeParameter}
                onToggleDisplay={toggleDisplay}
                onReset={resetProgram}
                onRescan={rescan}
              />
            </div>
          </section>

          <aside className={`analysis-sheet ${analysisOpen ? 'analysis-sheet--open' : ''}`}>
            <div className="analysis-sheet__header">
              <div>
                <p className="analysis-sheet__eyebrow">Analysis</p>
                <h2 className="analysis-sheet__title">Diagnostics</h2>
              </div>
              <button
                type="button"
                className="operator-bar__button"
                onClick={() => setAnalysisOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="analysis-sheet__body">
              <section className="analysis-card">
                <p className="analysis-card__label">Pipeline State</p>
                <p className="analysis-card__line">{analysis.primaryIssue}</p>
                <p className="analysis-card__line">{analysis.activeStageLabel}</p>
                {analysis.diagnostics.map((entry) => (
                  <p key={entry} className="analysis-card__line analysis-card__line--muted">
                    {entry}
                  </p>
                ))}
              </section>

              {relatedLesson ? (
                <section className="analysis-card">
                  <p className="analysis-card__label">Learning Link</p>
                  {currentMissionSet?.optionalInsight ? (
                    <p className="analysis-card__line analysis-card__line--muted">
                      {currentMissionSet.optionalInsight}
                    </p>
                  ) : null}
                  {relatedLesson ? <RelatedLessonCard lesson={relatedLesson} /> : null}
                </section>
              ) : null}

              {debugMode ? (
                <section className="analysis-card">
                  <p className="analysis-card__label">QA</p>
                  <p className="analysis-card__line">{gameplayQa.debugSummary}</p>
                  {gameplayQa.checks.map((check) => (
                    <p key={check.id} className="analysis-card__line analysis-card__line--muted">
                      {check.label}: {check.passed ? 'pass' : 'fail'}
                    </p>
                  ))}
                  <p className="analysis-card__line analysis-card__line--muted">
                    UI issues: {uiQa.checks.length}
                  </p>
                </section>
              ) : null}
            </div>
          </aside>
        </section>
      )}
    </main>
  )
}

export default App
