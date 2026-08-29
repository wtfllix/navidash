'use client';

import {
  ArrowDown,
  ArrowUp,
  CircleAlert,
  Cpu,
  HardDrive,
  MemoryStick,
  Radio,
  Server,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useKomariStatus } from '@/lib/komariStatus';
import type { KomariNodeSummary } from '@/lib/server/komari';
import { WidgetOfType } from '@/types';

interface KomariWidgetProps {
  widget: WidgetOfType<'komari'>;
}

function formatBytes(value: number, locale: string, perSecond = false) {
  if (!Number.isFinite(value)) return '—';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let next = Math.max(0, value);
  let index = 0;
  while (next >= 1024 && index < units.length - 1) {
    next /= 1024;
    index += 1;
  }
  const digits = next >= 100 || index === 0 ? 0 : 1;
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(next)} ${units[index]}${
    perSecond ? '/s' : ''
  }`;
}

function formatPercent(value: number | undefined, locale: string) {
  if (value === undefined) return '—';
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value)}%`;
}

function formatUptime(value: number | undefined, t: ReturnType<typeof useTranslations<'Widgets'>>) {
  if (value === undefined) return '—';
  const days = Math.floor(value / 86_400);
  if (days > 0) return t('komari_uptime_days', { count: days });
  const hours = Math.max(1, Math.floor(value / 3_600));
  return t('komari_uptime_hours', { count: hours });
}

function Meter({
  icon: Icon,
  label,
  value,
  percent,
  detail,
  iconColor,
  barColor,
}: {
  icon: typeof Cpu;
  label: string;
  value: string;
  percent?: number;
  detail: string;
  iconColor: string;
  barColor: string;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className="flex min-w-0 items-center gap-1.5 text-slate-500">
          <Icon size={13} className={iconColor} aria-hidden="true" />
          <span>{label}</span>
        </span>
        <span className="shrink-0 font-semibold tabular-nums text-slate-800">{value}</span>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full ${barColor}`}
          style={{ width: `${Math.min(100, Math.max(0, percent ?? 0))}%` }}
        />
      </div>
      <div className="mt-1.5 truncate text-[11px] tabular-nums text-slate-500">{detail}</div>
    </div>
  );
}

function DiskMeter({
  value,
  percent,
  detail,
  label,
}: {
  value: string;
  percent?: number;
  detail: string;
  label: string;
}) {
  return (
    <div className="col-span-2 min-w-0">
      <div className="flex items-center justify-between gap-3 text-[11px]">
        <span className="flex shrink-0 items-center gap-1.5 text-slate-500">
          <HardDrive size={13} className="text-amber-400" aria-hidden="true" />
          <span>{label}</span>
          <span className="font-semibold tabular-nums text-slate-800">{value}</span>
        </span>
        <span className="truncate tabular-nums text-slate-500">{detail}</span>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-amber-400"
          style={{ width: `${Math.min(100, Math.max(0, percent ?? 0))}%` }}
        />
      </div>
    </div>
  );
}

function TrafficMeter({
  network,
  locale,
  label,
  updatedLabel,
}: {
  network: {
    rxBytesPerSecond: number;
    txBytesPerSecond: number;
    totalDownBytes?: number;
    trafficLimitBytes?: number;
  } | undefined;
  locale: string;
  label: string;
  updatedLabel: string;
}) {
  const usedBytes = network?.totalDownBytes;
  const limitBytes = network?.trafficLimitBytes;
  const percent =
    usedBytes !== undefined && limitBytes !== undefined && limitBytes > 0
      ? Math.min(100, Math.max(0, (usedBytes / limitBytes) * 100))
      : undefined;

  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-3 text-[11px]">
        <span className="text-slate-500">{label}</span>
        <span className="truncate tabular-nums text-slate-600">
          {usedBytes === undefined ? '—' : formatBytes(usedBytes, locale)} /{' '}
          {limitBytes === 0 ? '∞' : formatBytes(limitBytes ?? NaN, locale)}
        </span>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-200">
        {percent !== undefined ? (
          <div className="h-full rounded-full bg-violet-400" style={{ width: `${percent}%` }} />
        ) : limitBytes === 0 ? (
          <div className="h-full w-full rounded-full bg-gradient-to-r from-violet-400 via-violet-300 to-violet-100" />
        ) : null}
      </div>
      <div className="mt-1.5 flex min-w-0 items-center justify-between gap-3 text-[10px] tabular-nums text-slate-500">
        <span className="flex min-w-0 items-center gap-4 overflow-hidden">
          <span className="flex items-center gap-1 whitespace-nowrap">
            <ArrowUp size={12} className="text-emerald-500" aria-hidden="true" />
            {formatBytes(network?.txBytesPerSecond ?? NaN, locale, true)}
          </span>
          <span className="flex items-center gap-1 whitespace-nowrap">
            <ArrowDown size={12} className="text-sky-500" aria-hidden="true" />
            {formatBytes(network?.rxBytesPerSecond ?? NaN, locale, true)}
          </span>
        </span>
        <span className="shrink-0 text-slate-400">{updatedLabel}</span>
      </div>
    </div>
  );
}

function NodeIdentity({
  node,
  mini = false,
}: {
  node: KomariNodeSummary;
  mini?: boolean;
}) {
  return (
    <div className={`flex min-w-0 items-center ${mini ? 'gap-1.5' : 'gap-2'}`}>
      <span
        className={`${mini ? 'h-2 w-2' : 'h-2.5 w-2.5'} shrink-0 rounded-full ${
          node.online ? 'bg-emerald-500' : 'bg-slate-400'
        }`}
        aria-hidden="true"
      />
      {node.regionFlag ? (
        <span
          className={`shrink-0 font-emoji leading-none ${mini ? 'text-sm' : 'text-base'}`}
          aria-hidden="true"
        >
          {node.regionFlag}
        </span>
      ) : null}
      <h3
        className={`truncate font-semibold tracking-[-0.03em] ${mini ? 'text-xs' : 'text-sm'}`}
        title={node.name}
      >
        {node.name}
      </h3>
    </div>
  );
}

function ResourceStrip({
  node,
  locale,
  labels,
  mini = false,
}: {
  node: KomariNodeSummary;
  locale: string;
  labels: { cpu: string; memory: string; disk: string };
  mini?: boolean;
}) {
  const resources = [
    {
      Icon: Cpu,
      label: labels.cpu,
      value: node.cpuPercent,
      iconColor: 'text-sky-400',
      barColor: 'bg-sky-400',
    },
    {
      Icon: MemoryStick,
      label: labels.memory,
      value: node.memory?.percent,
      iconColor: 'text-emerald-400',
      barColor: 'bg-emerald-400',
    },
    {
      Icon: HardDrive,
      label: labels.disk,
      value: node.disk?.percent,
      iconColor: 'text-amber-400',
      barColor: 'bg-amber-400',
    },
  ];

  return (
    <div
      className={`grid grid-cols-3 ${mini ? 'gap-1.5' : 'gap-3'}`}
      data-testid="komari-resource-strip"
    >
      {resources.map(({ Icon, label, value, iconColor, barColor }) => (
        <div key={label} className="min-w-0" title={`${label} ${formatPercent(value, locale)}`}>
          <div
            className={`flex items-center ${
              mini ? 'flex-col gap-0.5' : 'justify-between gap-1'
            } text-[10px]`}
          >
            <Icon size={mini ? 11 : 12} className={iconColor} aria-hidden="true" />
            <span className="truncate font-semibold tabular-nums text-slate-700">
              {formatPercent(value, locale)}
            </span>
          </div>
          <div
            className={`${
              mini ? 'mt-1 h-0.5' : 'mt-1.5 h-1'
            } overflow-hidden rounded-full bg-slate-200`}
          >
            <div
              className={`h-full rounded-full ${barColor}`}
              style={{ width: `${Math.min(100, Math.max(0, value ?? 0))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function CompactNodeCard({
  node,
  locale,
  showNetwork,
  labels,
  formatStatus,
}: {
  node: KomariNodeSummary;
  locale: string;
  showNetwork: boolean;
  labels: { cpu: string; memory: string; disk: string };
  formatStatus: () => string;
}) {
  return (
    <div className="flex h-full min-w-0 flex-col" data-testid="komari-layout-compact">
      <NodeIdentity node={node} />
      <div className="mt-2.5">
        <ResourceStrip node={node} locale={locale} labels={labels} />
      </div>
      <div className="mt-auto flex min-w-0 items-center justify-between gap-2 pt-2 text-[9px] tabular-nums text-slate-500">
        <span className="truncate">{formatStatus()}</span>
        {showNetwork ? (
          <span className="flex shrink-0 items-center gap-2" data-testid="komari-compact-network">
            <span className="flex items-center gap-0.5 whitespace-nowrap">
              <ArrowUp size={10} className="text-emerald-500" aria-hidden="true" />
              {formatBytes(node.network?.txBytesPerSecond ?? NaN, locale, true)}
            </span>
            <span className="flex items-center gap-0.5 whitespace-nowrap">
              <ArrowDown size={10} className="text-sky-500" aria-hidden="true" />
              {formatBytes(node.network?.rxBytesPerSecond ?? NaN, locale, true)}
            </span>
          </span>
        ) : null}
      </div>
    </div>
  );
}

function MiniNodeCard({
  node,
  locale,
  labels,
  formatStatus,
}: {
  node: KomariNodeSummary;
  locale: string;
  labels: { cpu: string; memory: string; disk: string };
  formatStatus: () => string;
}) {
  return (
    <div className="flex h-full min-w-0 flex-col" data-testid="komari-layout-mini">
      <NodeIdentity node={node} mini />
      <div className="mt-1 truncate text-[9px] text-slate-500">{formatStatus()}</div>
      <div className="mt-auto pt-2">
        <ResourceStrip node={node} locale={locale} labels={labels} mini />
      </div>
    </div>
  );
}

export default function KomariWidget({ widget }: KomariWidgetProps) {
  const t = useTranslations('Widgets');
  const locale = useLocale();
  const nodeId = widget.config.nodeId;
  const status = useKomariStatus(nodeId, widget.config.refreshInterval ?? 5);
  const showNetwork = widget.config.showNetwork ?? true;
  const isMini = widget.size.w === 1 && widget.size.h === 1;
  const isCompact = !isMini && widget.size.h === 1;
  const density = isMini ? 'mini' : isCompact ? 'compact' : 'full';

  const openKomari = () => window.open('/api/komari/open', '_blank', 'noopener,noreferrer');
  const node = status?.state === 'ok' ? status.node : undefined;

  return (
    <button
      type="button"
      onClick={openKomari}
      className={`relative flex h-full w-full cursor-pointer flex-col overflow-hidden bg-[#f8fafc] text-left text-slate-900 transition-colors hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
        isMini || isCompact ? 'p-3' : 'p-4'
      }`}
      data-testid="komari-widget"
      aria-label={t('komari_open')}
    >
      {!status ? (
        <div
          className={`flex h-full items-center justify-center gap-2 text-slate-500 ${
            isMini ? 'text-[10px]' : 'text-sm'
          }`}
        >
          <Radio size={16} className="animate-pulse text-emerald-400" aria-hidden="true" />
          <span className="line-clamp-2">{t('komari_loading')}</span>
        </div>
      ) : status.state === 'unconfigured' ? (
        <EmptyState
          icon={Server}
          title={t('komari_unconfigured_title')}
          detail={t('komari_unconfigured')}
          density={density}
        />
      ) : status.state === 'not_found' ? (
        <EmptyState
          icon={CircleAlert}
          title={t('komari_node_missing')}
          detail={t('komari_node_missing_hint')}
          density={density}
        />
      ) : status.state === 'unavailable' || !node ? (
        <EmptyState
          icon={CircleAlert}
          title={t('komari_unavailable_title')}
          detail={t('komari_unavailable')}
          density={density}
        />
      ) : isMini ? (
        <MiniNodeCard
          node={node}
          locale={locale}
          labels={{ cpu: t('komari_cpu'), memory: t('komari_memory'), disk: t('komari_disk') }}
          formatStatus={() =>
            node.online ? formatUptime(node.uptimeSeconds, t) : t('komari_offline')
          }
        />
      ) : isCompact ? (
        <CompactNodeCard
          node={node}
          locale={locale}
          showNetwork={showNetwork}
          labels={{ cpu: t('komari_cpu'), memory: t('komari_memory'), disk: t('komari_disk') }}
          formatStatus={() =>
            node.online ? formatUptime(node.uptimeSeconds, t) : t('komari_offline')
          }
        />
      ) : (
        <div className="contents" data-testid="komari-layout-full">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${node.online ? 'bg-emerald-500' : 'bg-slate-400'}`}
                  aria-hidden="true"
                />
                {node.regionFlag ? (
                  <span className="shrink-0 font-emoji text-base leading-none" aria-hidden="true">
                    {node.regionFlag}
                  </span>
                ) : null}
                <h3 className="truncate text-base font-semibold tracking-[-0.03em]">{node.name}</h3>
              </div>
              <div className="mt-1.5 text-[11px] text-slate-500">
                {node.online ? t('komari_online_uptime', { uptime: formatUptime(node.uptimeSeconds, t) }) : t('komari_offline')}
              </div>
            </div>
            <Server size={16} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3">
            <Meter
              icon={Cpu}
              label={t('komari_cpu')}
              value={formatPercent(node.cpuPercent, locale)}
              percent={node.cpuPercent}
              detail=""
              iconColor="text-sky-400"
              barColor="bg-sky-400"
            />
            <Meter
              icon={MemoryStick}
              label={t('komari_memory')}
              value={formatPercent(node.memory?.percent, locale)}
              percent={node.memory?.percent}
              detail={node.memory ? `${formatBytes(node.memory.usedBytes, locale)} / ${formatBytes(node.memory.totalBytes, locale)}` : '—'}
              iconColor="text-emerald-400"
              barColor="bg-emerald-400"
            />
            <DiskMeter
              label={t('komari_disk')}
              value={formatPercent(node.disk?.percent, locale)}
              percent={node.disk?.percent}
              detail={node.disk ? `${formatBytes(node.disk.usedBytes, locale)} / ${formatBytes(node.disk.totalBytes, locale)}` : '—'}
            />
          </div>

          <div className="mt-auto pt-3">
            {showNetwork ? (
              <TrafficMeter
                network={node.network}
                locale={locale}
                label={t('komari_traffic')}
                updatedLabel={t('komari_updated', {
                  time: new Intl.DateTimeFormat(locale, {
                    hour: '2-digit',
                    minute: '2-digit',
                  }).format(new Date(node.updatedAt)),
                })}
              />
            ) : (
              <div className="text-[10px] text-slate-400">
                {t('komari_updated', {
                  time: new Intl.DateTimeFormat(locale, {
                    hour: '2-digit',
                    minute: '2-digit',
                  }).format(new Date(node.updatedAt)),
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </button>
  );
}

function EmptyState({
  icon: Icon,
  title,
  detail,
  density = 'full',
}: {
  icon: typeof Server;
  title: string;
  detail: string;
  density?: 'full' | 'compact' | 'mini';
}) {
  const isMini = density === 'mini';
  const isCompact = density === 'compact';
  return (
    <div className={`flex h-full flex-col items-center justify-center text-center ${isMini ? 'px-1' : 'px-4'}`}>
      <Icon size={isMini || isCompact ? 18 : 22} className="text-slate-400" aria-hidden="true" />
      <div className={`${isMini ? 'mt-1.5 text-[10px]' : 'mt-3 text-sm'} font-semibold text-slate-700`}>
        {title}
      </div>
      {!isMini ? (
        <div className={`${isCompact ? 'line-clamp-2 text-[10px] leading-4' : 'text-xs leading-5'} mt-1 text-slate-500`}>
          {detail}
        </div>
      ) : null}
    </div>
  );
}
