import { fetchUtils } from 'react-admin';
import { stringify } from 'query-string';

const apiUrl = '/api/admin'; // FastAPI 어드민용 엔드포인트 prefix

/**
 * JWT 토큰을 로컬스토리지에서 읽는 함수
 * (백엔드에서 쿠키 기반이라면 localStorage 대신 자동 쿠키 전송)
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token'); // 필요시 수정
  const headers = new Headers({ Accept: 'application/json' });

  if (token) headers.set('Authorization', `Bearer ${token}`);
  headers.set('Content-Type', 'application/json');

  return headers;
};

/**
 * 공통 fetch 래퍼
 */
const httpClient = async (url, options = {}) => {
  options.headers = getAuthHeaders();
  options.credentials = 'include'; // ✅ 쿠키 방식 로그인 시 필요

  try {
    const { json, headers } = await fetchUtils.fetchJson(url, options);
    return { json, headers };
  } catch (error) {
    console.error('❌ API 요청 실패:', error);
    throw error; // react-admin 내부 에러 핸들링
  }
};

/**
 * react-admin 표준 dataProvider
 */
export const dataProvider = {
  getList: (resource, params) => {
    const { page, perPage } = params.pagination;
    const { field, order } = params.sort;
    const query = {
      sort: JSON.stringify([field, order]),
      range: JSON.stringify([(page - 1) * perPage, page * perPage - 1]),
      filter: JSON.stringify(params.filter),
    };
    const url = `${apiUrl}/${resource}?${stringify(query)}`;

    return httpClient(url).then(({ headers, json }) => ({
      data: json,
      total: parseInt(headers.get('content-range')?.split('/')?.pop() || json.total || 0, 10),
    }));
  },

  getOne: (resource, params) =>
    httpClient(`${apiUrl}/${resource}/${params.id}`).then(({ json }) => ({
      data: json,
    })),

  getMany: (resource, params) => {
    const query = {
      filter: JSON.stringify({ id: params.ids }),
    };
    const url = `${apiUrl}/${resource}?${stringify(query)}`;
    return httpClient(url).then(({ json }) => ({ data: json }));
  },

  getManyReference: (resource, params) => {
    const { page, perPage } = params.pagination;
    const { field, order } = params.sort;
    const query = {
      sort: JSON.stringify([field, order]),
      range: JSON.stringify([(page - 1) * perPage, page * perPage - 1]),
      filter: JSON.stringify({
        ...params.filter,
        [params.target]: params.id,
      }),
    };
    const url = `${apiUrl}/${resource}?${stringify(query)}`;

    return httpClient(url).then(({ headers, json }) => ({
      data: json,
      total: parseInt(headers.get('content-range')?.split('/')?.pop() || json.total || 0, 10),
    }));
  },

  update: (resource, params) =>
    httpClient(`${apiUrl}/${resource}/${params.id}`, {
      method: 'PUT',
      body: JSON.stringify(params.data),
    }).then(({ json }) => ({ data: json })),

  updateMany: (resource, params) => {
    const query = { filter: JSON.stringify({ id: params.ids }) };
    return httpClient(`${apiUrl}/${resource}?${stringify(query)}`, {
      method: 'PUT',
      body: JSON.stringify(params.data),
    }).then(({ json }) => ({ data: json }));
  },

  create: (resource, params) =>
    httpClient(`${apiUrl}/${resource}`, {
      method: 'POST',
      body: JSON.stringify(params.data),
    }).then(({ json }) => ({
      data: { ...params.data, id: json.id ?? json.data?.id },
    })),

  delete: (resource, params) =>
    httpClient(`${apiUrl}/${resource}/${params.id}`, {
      method: 'DELETE',
    }).then(({ json }) => ({ data: json })),

  deleteMany: (resource, params) => {
    const query = { filter: JSON.stringify({ id: params.ids }) };
    return httpClient(`${apiUrl}/${resource}?${stringify(query)}`, {
      method: 'DELETE',
    }).then(({ json }) => ({ data: json }));
  },
};
