import React, { useState, useEffect, useMemo } from 'react';
import { Table, Popover, Input, Descriptions, Tag, Image, Empty, Button, Toast, Divider } from '@douyinfe/semi-ui';
import { useActions, useSelector } from '../../../services/state/store.js';
import { IconClose, IconDelete, IconSearch, IconStar, IconStarStroked, IconTick } from '@douyinfe/semi-icons';
import * as timeService from '../../../services/time/timeService.js';
import debounce from 'lodash/debounce';
import no_image from '../../../assets/no_image.jpg';

import './ListingsTable.less';
import { format } from '../../../services/time/timeService.js';
import { IllustrationNoResult, IllustrationNoResultDark } from '@douyinfe/semi-illustrations';
import { xhrDelete, xhrPost } from '../../../services/xhr.js';
import ListingsFilter from './ListingsFilter.jsx';

const columns = [
  {
    title: '#',
    width: 100,
    dataIndex: 'isWatched',
    sorter: true,
    render: (id, row) => {
      return (
        <div>
          <Popover
            style={{
              padding: '.4rem',
              color: 'var(--semi-color-white)',
            }}
            content={row.isWatched === 1 ? 'Unwatch Listing' : 'Watch Listing'}
          >
            <Button
              icon={
                row.isWatched === 1 ? (
                  <IconStar style={{ color: 'rgba(var(--semi-green-5), 1)' }} />
                ) : (
                  <IconStarStroked />
                )
              }
              theme="borderless"
              size="small"
              onClick={async () => {
                try {
                  await xhrPost('/api/listings/watch', { listingId: row.id });
                  Toast.success(row.isWatched === 1 ? 'Listing removed from Watchlist' : 'Listing added to Watchlist');
                  row.reloadTable();
                } catch (e) {
                  console.error(e);
                  Toast.error('Failed to operate Watchlist');
                }
              }}
            />
          </Popover>
          <Divider layout="vertical" margin="4px" />
          <Popover
            style={{
              padding: '.4rem',
              color: 'var(--semi-color-white)',
            }}
            content="Delete Listing"
          >
            <Button
              icon={<IconDelete />}
              theme="borderless"
              size="small"
              type="danger"
              onClick={async () => {
                try {
                  await xhrDelete('/api/listings/', { ids: [row.id] });
                  Toast.success('Listing(s) successfully removed');
                  row.reloadTable();
                } catch (error) {
                  Toast.error(error);
                }
              }}
            />
          </Popover>
        </div>
      );
    },
  },
  {
    title: 'State',
    dataIndex: 'is_active',
    width: 84,
    sorter: true,
    render: (value) => {
      return value ? (
        <div style={{ color: 'rgba(var(--semi-green-6), 1)' }}>
          <Popover
            style={{
              padding: '.4rem',
              color: 'var(--semi-color-white)',
            }}
            content="Listing is still active"
          >
            <IconTick />
          </Popover>
        </div>
      ) : (
        <div style={{ color: 'rgba(var(--semi-red-5), 1)' }}>
          <Popover
            style={{
              padding: '.4rem',
              color: 'var(--semi-color-white)',
            }}
            content="Listing is inactive"
          >
            <IconClose />
          </Popover>
        </div>
      );
    },
  },
  {
    title: 'Job-Name',
    sorter: true,
    ellipsis: true,
    dataIndex: 'job_name',
    width: 150,
  },
  {
    title: 'Listing date',
    width: 130,
    dataIndex: 'created_at',
    sorter: true,
    render: (text) => timeService.format(text, false),
  },
  {
    title: 'Provider',
    width: 130,
    dataIndex: 'provider',
    sorter: true,
    render: (text) => text.charAt(0).toUpperCase() + text.slice(1),
  },
  {
    title: 'Price',
    width: 110,
    dataIndex: 'price',
    sorter: true,
    render: (text) => text + ' €',
  },
  {
    title: 'Address',
    width: 150,
    dataIndex: 'address',
    sorter: true,
  },
  {
    title: 'Title',
    dataIndex: 'title',
    sorter: true,
    ellipsis: true,
    render: (text, row) => {
      return (
        <a href={row.url} target="_blank" rel="noopener noreferrer">
          {text}
        </a>
      );
    },
  },
];

const empty = (
  <Empty
    image={<IllustrationNoResult />}
    darkModeImage={<IllustrationNoResultDark />}
    description="No listings available."
  />
);

export default function ListingsTable() {
  const tableData = useSelector((state) => state.listingsTable);
  const actions = useActions();
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [sortData, setSortData] = useState({});
  const [freeTextFilter, setFreeTextFilter] = useState(null);
  const [watchListFilter, setWatchListFilter] = useState(null);
  const [jobNameFilter, setJobNameFilter] = useState(null);
  const [activityFilter, setActivityFilter] = useState(null);
  const [providerFilter, setProviderFilter] = useState(null);

  const handlePageChange = (_page) => {
    setPage(_page);
  };

  const loadTable = () => {
    let sortfield = null;
    let sortdir = null;

    if (sortData != null && Object.keys(sortData).length > 0) {
      sortfield = sortData.field;
      sortdir = sortData.direction;
    }
    actions.listingsTable.getListingsTable({
      page,
      pageSize,
      sortfield,
      sortdir,
      freeTextFilter,
      filter: { watchListFilter, jobNameFilter, activityFilter, providerFilter },
    });
  };

  useEffect(() => {
    loadTable();
  }, [page, sortData, freeTextFilter, providerFilter, activityFilter, jobNameFilter, watchListFilter]);

  const handleFilterChange = useMemo(() => debounce((value) => setFreeTextFilter(value), 500), []);

  const expandRowRender = (record) => {
    return (
      <div className="listingsTable__expanded">
        <div>
          {record.image_url == null ? (
            <Image height={200} src={no_image} />
          ) : (
            <Image height={200} src={record.image_url} />
          )}
        </div>
        <div>
          <Descriptions align="justify">
            <Descriptions.Item itemKey="Listing still online">
              <Tag size="small" shape="circle" color={record.is_active ? 'green' : 'red'}>
                {record.is_active ? 'Yes' : 'No'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item itemKey="Link">
              <a href={record.link} target="_blank" rel="noreferrer">
                Link to Listing
              </a>
            </Descriptions.Item>
            <Descriptions.Item itemKey="Listing date">{format(record.created_at)}</Descriptions.Item>
            <Descriptions.Item itemKey="Price">{record.price} €</Descriptions.Item>
          </Descriptions>
          <b>{record.title}</b>
          <p>{record.description == null ? 'No description available' : record.description}</p>
          {/* Render additional pictures: try DB-backed raw images first, fallback to record.additionalpictures */}
          <RawImages listingId={record.id} fallback={record.additionalpictures} />
          {/* Render additional documents (PDFs etc.) if present on the record */}
          {renderAdditionalDocuments(record.additionaldocuments)}
        </div>
      </div>
    );
  };

  // Helper: normalize additionalpictures input to an array of valid URL strings
  // Accepts: null/undefined, string (single url), array of mixed values
  // Returns: array (possibly empty) with at most 8 items
  function normalizeAdditionalPictures(input, max = 16) {
    try {
      if (!input) return [];

      // If it's a single string, return it as an array
      if (typeof input === 'string') {
        return input.trim() ? [input.trim()] : [];
      }

      // If it's an array-like, filter for strings
      if (Array.isArray(input)) {
        const urls = input
          .map((v) => {
            if (typeof v === 'string') return v.trim();
            if (v && typeof v === 'object') {
              // common fields that may contain the link
              if (typeof v.url === 'string' && v.url.trim()) return v.url.trim();
              if (typeof v.link === 'string' && v.link.trim()) return v.link.trim();
              // sometimes the object may be nested like { reference: { url: '...' } }
              if (
                v.reference &&
                typeof v.reference === 'object' &&
                typeof v.reference.url === 'string' &&
                v.reference.url.trim()
              )
                return v.reference.url.trim();
            }
            return null;
          })
          .filter((v) => v && v.length > 0);

        // dedupe while preserving order
        const seen = new Set();
        const unique = [];
        for (const u of urls) {
          if (!seen.has(u)) {
            seen.add(u);
            unique.push(u);
          }
          if (unique.length >= max) break;
        }
        return unique.slice(0, max);
      }

      // If it's an object with properties (maybe keyed list), try to extract string values
      if (typeof input === 'object') {
        const vals = Object.values(input)
          .map((v) => (typeof v === 'string' ? v.trim() : null))
          .filter((v) => v && v.length > 0);
        return vals.slice(0, max);
      }

      return [];
    } catch (err) {
      // Defensive: if anything unexpected happens, return empty list and log once
      // eslint-disable-next-line no-console
      console.error('normalizeAdditionalPictures failed', err);
      return [];
    }
  }

  // note: simplified - we show the raw additionaldocuments value in the UI

  // extract URLs from various shapes of additionaldocuments (string, array, object)
  function extractDocumentUrls(input, max = 16) {
    try {
      if (!input) return [];

      const candidates = [];

      const pushIfString = (v) => {
        if (typeof v === 'string' && v.trim()) candidates.push(v.trim());
      };

      if (typeof input === 'string') {
        // if it's JSON encoded, try to parse
        const s = input.trim();
        if ((s.startsWith('[') || s.startsWith('{')) && s.includes('http')) {
          try {
            const parsed = JSON.parse(s);
            return extractDocumentUrls(parsed, max);
          } catch (e) {
            // fall through
            console.warn('Failed to parse JSON', e);
          }
        }
        pushIfString(s);
      }

      if (Array.isArray(input)) {
        for (const v of input) {
          if (!v) continue;
          if (typeof v === 'string') pushIfString(v);
          else if (typeof v === 'object') {
            if (typeof v.url === 'string') pushIfString(v.url);
            else if (typeof v.link === 'string') pushIfString(v.link);
            else if (v.reference && typeof v.reference === 'object') {
              if (typeof v.reference.url === 'string') pushIfString(v.reference.url);
              else if (typeof v.reference.link === 'string') pushIfString(v.reference.link);
            }
          }
        }
      }

      if (typeof input === 'object' && !Array.isArray(input)) {
        // inspect object values for urls
        for (const v of Object.values(input)) {
          if (!v) continue;
          if (typeof v === 'string') pushIfString(v);
          else if (typeof v === 'object') {
            if (typeof v.url === 'string') pushIfString(v.url);
            else if (typeof v.link === 'string') pushIfString(v.link);
            else if (v.reference && typeof v.reference === 'object') {
              if (typeof v.reference.url === 'string') pushIfString(v.reference.url);
              else if (typeof v.reference.link === 'string') pushIfString(v.reference.link);
            }
          }
        }
      }

      // dedupe & limit
      const seen = new Set();
      const out = [];
      for (const u of candidates) {
        if (!u) continue;
        if (!seen.has(u)) {
          seen.add(u);
          out.push(u);
        }
        if (out.length >= max) break;
      }
      return out;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('extractDocumentUrls failed', err);
      return [];
    }
  }

  function getFilenameFromUrl(u) {
    try {
      if (!u || typeof u !== 'string') return 'Document';
      const parts = u.split('/').filter(Boolean);
      const last = parts[parts.length - 1] || u;
      try {
        return decodeURIComponent(last.split('?')[0]);
      } catch (e) {
        console.warn('Failed to decode URI component', e);
        return last.split('?')[0];
      }
    } catch (e) {
      console.warn('Failed to decode URI component', e);
      return 'Document';
    }
  }

  function renderAdditionalDocuments(additionaldocuments) {
    try {
      if (additionaldocuments == null) return null;

      const urls = extractDocumentUrls(additionaldocuments, 32);
      if (urls.length === 0) {
        // fallback: show raw content for visibility
        return (
          <div className="listingsTable__additionaldocuments" style={{ marginTop: 8 }}>
            <div style={{ marginBottom: 6, fontSize: 13, color: 'var(--semi-color-text-2)' }}>
              additional documents here:
            </div>
            <div style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>
              {typeof additionaldocuments === 'string'
                ? additionaldocuments
                : JSON.stringify(additionaldocuments, null, 2)}
            </div>
          </div>
        );
      }

      return (
        <div className="listingsTable__additionaldocuments" style={{ marginTop: 8 }}>
          <div style={{ marginBottom: 6, fontSize: 13, color: 'var(--semi-color-text-2)' }}>
            additional documents here:
          </div>
          {urls.map((u, idx) => (
            <div key={idx} style={{ marginBottom: 6 }}>
              <a
                href={u}
                target="_blank"
                rel="noopener noreferrer"
                className="listingsTable__additionaldocuments__link"
              >
                {getFilenameFromUrl(u)}
              </a>
            </div>
          ))}
        </div>
      );
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('renderAdditionalDocuments failed', e);
      return null;
    }
  }

  /**
   * Component: RawImages
   * - Tries to fetch image entries for a listing from the server (listings_raw).
   * - Calls POST /api/listings/raw with { listingId } and expects { status, json } response
   *   where json is an array of rows: { id, link?, mime_type?, rawdata? } and rawdata is base64
   * - If DB data is present, uses data URLs built from base64 rawdata (preferred). If not,
   *   falls back to the existing `fallback` prop (record.additionalpictures).
   */
  function RawImages({ listingId, fallback }) {
    const [pics, setPics] = useState(null);
    const MAX = 16;

    useEffect(() => {
      let mounted = true;
      async function load() {
        try {
          const res = await xhrPost('/api/listings/raw', { listingId });
          const data = Array.isArray(res) ? res : res?.json || [];
          if (Array.isArray(data) && data.length > 0) {
            const urls = data
              .map((r) => {
                if (r.rawdata) {
                  const mime = r.mime_type || 'application/octet-stream';
                  return `data:${mime};base64,${r.rawdata}`;
                }
                if (r.link) return r.link;
                return null;
              })
              .filter(Boolean)
              .slice(0, MAX);
            if (urls.length > 0) {
              if (mounted) setPics(urls);
              return;
            }
          }
        } catch (e) {
          // ignore and fall back
          console.warn('Failed to load raw images from DB, falling back', e);
        }

        // fallback to record data if DB fetch failed or returned nothing
        const fallbackUrls = normalizeAdditionalPictures(fallback, MAX);
        if (mounted) setPics(fallbackUrls);
      }

      load();
      return () => {
        mounted = false;
      };
    }, [listingId, fallback]);

    if (!pics || pics.length === 0) return null;

    try {
      return (
        <div className="listingsTable__additionalpictures">
          {pics.map((pic, idx) => (
            <a key={idx} target="_blank" rel="noopener noreferrer" className="listingsTable__additionalpictures__link">
              <Image
                src={pic}
                width={80}
                height={80}
                style={{ objectFit: 'cover', borderRadius: 4, marginRight: 8 }}
                fallback={no_image}
                alt={`more-pic-${idx}`}
              />
            </a>
          ))}
        </div>
      );
    } catch (e) {
      console.warn('Failed to render RawImages', e);
      return null;
    }
  }

  // Basic URL validator to avoid rendering non-URL strings into href/src attrs
  //function isValidUrl(s) {
  //  if (typeof s !== 'string') return false;
  //  try {
  //    const url = new URL(s);
  //    return url.protocol === 'http:' || url.protocol === 'https:';
  //  } catch (e) {
  //    return false;
  //  }
  //}

  return (
    <div>
      <ListingsFilter
        onActivityFilter={setActivityFilter}
        onWatchListFilter={setWatchListFilter}
        onJobNameFilter={setJobNameFilter}
        onProviderFilter={setProviderFilter}
      />
      <Input
        prefix={<IconSearch />}
        showClear
        className="listingsTable__search"
        placeholder="Search"
        onChange={handleFilterChange}
      />
      <Table
        rowKey="id"
        empty={empty}
        hideExpandedColumn={false}
        sticky={{ top: 5 }}
        columns={columns}
        expandedRowRender={expandRowRender}
        dataSource={(tableData?.result || []).map((row) => {
          return {
            ...row,
            reloadTable: loadTable,
          };
        })}
        onChange={(changeSet) => {
          if (changeSet?.extra?.changeType === 'sorter') {
            setSortData({
              field: changeSet.sorter.dataIndex,
              direction: changeSet.sorter.sortOrder === 'ascend' ? 'asc' : 'desc',
            });
          }
        }}
        pagination={{
          currentPage: page,
          //for now fixed
          pageSize,
          total: tableData?.totalNumber || 0,
          onPageChange: handlePageChange,
        }}
      />
    </div>
  );
}
