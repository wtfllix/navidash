'use client';

import { useCallback, useSyncExternalStore } from 'react';
import type { KomariStatusResponse, KomariStatusesResponse } from '@/lib/server/komari';

type Listener = () => void;

interface Subscription {
  listeners: Map<Listener, number>;
}

const subscriptions = new Map<string, Subscription>();
const statuses = new Map<string, KomariStatusResponse>();
const missingNodeStatus: KomariStatusResponse = { state: 'not_found', nodes: [] };
let pollTimer: number | null = null;
let immediateTimer: number | null = null;
let polling = false;
let refreshAfterPolling = false;
let visibilityListening = false;

function clearPollTimer() {
  if (pollTimer !== null) {
    window.clearTimeout(pollTimer);
    pollTimer = null;
  }
}

function getPollingInterval() {
  let interval = 30_000;
  for (const subscription of Array.from(subscriptions.values())) {
    for (const refreshInterval of Array.from(subscription.listeners.values())) {
      interval = Math.min(interval, refreshInterval);
    }
  }
  return interval;
}

function notify(nodeIds: string[]) {
  for (const nodeId of nodeIds) {
    for (const listener of Array.from(subscriptions.get(nodeId)?.listeners.keys() ?? [])) listener();
  }
}

function scheduleNextPoll() {
  clearPollTimer();
  if (subscriptions.size === 0 || document.visibilityState === 'hidden') return;
  pollTimer = window.setTimeout(() => void refreshStatuses(), getPollingInterval());
}

function queueImmediateRefresh() {
  clearPollTimer();
  if (subscriptions.size === 0 || document.visibilityState === 'hidden') return;
  if (polling) {
    refreshAfterPolling = true;
    return;
  }
  if (immediateTimer !== null) return;
  immediateTimer = window.setTimeout(() => {
    immediateTimer = null;
    void refreshStatuses();
  }, 0);
}

async function refreshStatuses() {
  if (polling) {
    refreshAfterPolling = true;
    return;
  }
  if (subscriptions.size === 0 || document.visibilityState === 'hidden') return;

  const nodeIds = Array.from(subscriptions.keys()).sort();
  polling = true;
  try {
    const params = new URLSearchParams();
    nodeIds.forEach((nodeId) => params.append('nodeId', nodeId));
    const response = await fetch(`/api/komari/status?${params.toString()}`, { cache: 'no-store' });
    const data = (await response.json()) as KomariStatusesResponse;
    if (!response.ok || !data || !('state' in data)) throw new Error('Komari status request failed');

    if (data.state === 'ok') {
      for (const nodeId of nodeIds) {
        const node = data.nodes[nodeId];
        statuses.set(
          nodeId,
          node
            ? { state: 'ok', sampledAt: data.sampledAt, node }
            : { state: 'not_found', nodes: [] }
        );
      }
    } else {
      for (const nodeId of nodeIds) statuses.set(nodeId, { state: data.state, nodes: [] });
    }
  } catch {
    for (const nodeId of nodeIds) statuses.set(nodeId, { state: 'unavailable', nodes: [] });
  } finally {
    polling = false;
    notify(nodeIds);
    if (refreshAfterPolling) {
      refreshAfterPolling = false;
      queueImmediateRefresh();
    } else {
      scheduleNextPoll();
    }
  }
}

function onVisibilityChange() {
  if (document.visibilityState === 'visible') queueImmediateRefresh();
  else clearPollTimer();
}

function subscribe(nodeId: string, refreshInterval: number, listener: Listener) {
  let subscription = subscriptions.get(nodeId);
  if (!subscription) {
    subscription = { listeners: new Map() };
    subscriptions.set(nodeId, subscription);
  }
  subscription.listeners.set(listener, refreshInterval);

  if (!visibilityListening) {
    document.addEventListener('visibilitychange', onVisibilityChange);
    visibilityListening = true;
  }
  queueImmediateRefresh();

  return () => {
    const current = subscriptions.get(nodeId);
    if (!current) return;
    current.listeners.delete(listener);
    if (current.listeners.size === 0) subscriptions.delete(nodeId);
    if (subscriptions.size === 0) {
      clearPollTimer();
      if (immediateTimer !== null) {
        window.clearTimeout(immediateTimer);
        immediateTimer = null;
      }
      if (visibilityListening) {
        document.removeEventListener('visibilitychange', onVisibilityChange);
        visibilityListening = false;
      }
    }
  };
}

export function useKomariStatus(nodeId: string | undefined, refreshIntervalSeconds: number) {
  const refreshInterval = refreshIntervalSeconds * 1_000;
  const subscribeToStatus = useCallback(
    (listener: Listener) => (nodeId ? subscribe(nodeId, refreshInterval, listener) : () => undefined),
    [nodeId, refreshInterval]
  );
  const getSnapshot = useCallback(
    () => (nodeId ? statuses.get(nodeId) ?? null : missingNodeStatus),
    [nodeId]
  );
  return useSyncExternalStore(subscribeToStatus, getSnapshot, () => null);
}
