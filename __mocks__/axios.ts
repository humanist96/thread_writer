// Mock for axios

const mockAxios = {
  get: jest.fn().mockResolvedValue({
    data: '<text start="0" dur="2">Mock transcript text</text><text start="2" dur="3">More mock content</text>',
    status: 200,
    statusText: 'OK'
  }),
  post: jest.fn().mockResolvedValue({
    data: { success: true },
    status: 200,
    statusText: 'OK'
  })
}

export default mockAxios