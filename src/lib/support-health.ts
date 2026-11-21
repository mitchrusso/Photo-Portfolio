export type SupportHealthCounts = {
  expiredLeases: number
  failedAlerts: number
  overdueCases: number
  overdueResponses: number
  stalledRepairs: number
  unresolvedEscalations: number
}

export type SupportOperationalState = {
  counts: SupportHealthCounts
  externalWorkerFresh: boolean
  workerFresh: boolean
}

export function isSupportEngineOperational(state: SupportOperationalState) {
  return state.workerFresh
    && state.externalWorkerFresh
    && state.counts.overdueCases === 0
    && state.counts.expiredLeases === 0
    && state.counts.overdueResponses === 0
    && state.counts.failedAlerts === 0
    && state.counts.stalledRepairs === 0
}

export function isSupportEngineAllClear(state: SupportOperationalState) {
  return isSupportEngineOperational(state) && state.counts.unresolvedEscalations === 0
}
