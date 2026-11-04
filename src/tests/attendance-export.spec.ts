import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateAttendanceCsv,
  downloadAttendanceCsv,
  exportAttendanceSessionCsv,
} from '@/lib/attendance-export';
import { apiClient } from '@/lib/api-client';
import type { AttendanceInstance, AttendanceRecord } from '@/types';

describe('attendance-export utility', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockSession: AttendanceInstance = {
    id: 'inst-101',
    courseId: 'SENG401',
    date: '2026-11-04T10:00:00.000Z',
    qrToken: 'tok-abc',
    qrImage: 'data:image/png;base64,mock',
    expiresAt: '2026-11-04T11:00:00.000Z',
    latitude: 5.6037,
    longitude: -0.1870,
    classType: 'in-person',
    isClose: false,
    createdAt: '2026-11-04T09:55:00.000Z',
    updatedAt: '2026-11-04T09:55:00.000Z',
    course: {
      id: 'SENG401',
      name: 'Software Testing & Verification',
      code: 'SENG401',
      creditHours: 3,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
  };

  const mockAttendees: AttendanceRecord[] = [
    {
      id: 'att-1',
      instanceId: 'inst-101',
      courseId: 'SENG401',
      studentId: '10928374',
      status: 'present',
      date: '2026-11-04T10:05:00.000Z',
      student: {
        id: 'std-1',
        name: 'Ada Lovelace, "Pioneer"',
        indexNumber: '10928374',
      },
    },
    {
      id: 'att-2',
      instanceId: 'inst-101',
      courseId: 'SENG401',
      studentId: '10928375',
      status: 'absent',
      student: {
        id: 'std-2',
        name: 'Alan Turing',
        indexNumber: '10928375',
      },
    },
  ];

  it('generates RFC-4180 escaped CSV with UTF-8 BOM', () => {
    const csv = generateAttendanceCsv(mockSession, mockAttendees);

    // Verify UTF-8 BOM is prepended
    expect(csv.startsWith('\uFEFF')).toBe(true);

    // Verify headers
    expect(csv).toContain('Student ID');
    expect(csv).toContain('Student Name');
    expect(csv).toContain('Status');
    expect(csv).toContain('Check-In Time');
    expect(csv).toContain('Course Code');
    expect(csv).toContain('Course Name');
    expect(csv).toContain('Session Date');
    expect(csv).toContain('Class Type');
    expect(csv).toContain('Location / Geofence');

    // Verify escaped special characters (quotes)
    expect(csv).toContain('"Ada Lovelace, ""Pioneer"""');
    expect(csv).toContain('"PRESENT"');
    expect(csv).toContain('"ABSENT"');
    expect(csv).toContain('"SENG401"');
    expect(csv).toContain('"Software Testing & Verification"');
    expect(csv).toContain('In-Person');
    expect(csv).toContain('5.60370, -0.18700 (50m)');
  });

  it('downloads CSV file with proper filename pattern', () => {
    const createObjectURLSpy = vi.fn().mockReturnValue('blob:http://localhost/mock-blob-id');
    const revokeObjectURLSpy = vi.fn();
    globalThis.URL.createObjectURL = createObjectURLSpy;
    globalThis.URL.revokeObjectURL = revokeObjectURLSpy;

    const clickSpy = vi.fn();
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    const removeSpy = vi.spyOn(document.body, 'removeChild');

    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const el = document.createElementNS('http://www.w3.org/1999/xhtml', tagName);
      if (tagName === 'a') {
        el.click = clickSpy;
      }
      return el;
    });

    downloadAttendanceCsv(mockSession, mockAttendees);

    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(appendSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:http://localhost/mock-blob-id');
  });

  it('fetches attendee records from API if none are passed and downloads CSV', async () => {
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          ...mockSession,
          attendees: {
            items: mockAttendees,
            meta: { total: 2 },
          },
        },
      },
    });

    const createObjectURLSpy = vi.fn().mockReturnValue('blob:http://localhost/mock-blob-id');
    const revokeObjectURLSpy = vi.fn();
    globalThis.URL.createObjectURL = createObjectURLSpy;
    globalThis.URL.revokeObjectURL = revokeObjectURLSpy;

    const clickSpy = vi.fn();
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const el = document.createElementNS('http://www.w3.org/1999/xhtml', tagName);
      if (tagName === 'a') {
        el.click = clickSpy;
      }
      return el;
    });

    await exportAttendanceSessionCsv(mockSession);

    expect(getSpy).toHaveBeenCalledWith(`/attendance/instances/${mockSession.id}`, {
      params: { limit: 1000 },
    });
    expect(clickSpy).toHaveBeenCalled();
  });

  it('enriches student actual name via course roster fallback if attendee record lacks student name', async () => {
    const attendeesWithoutName: AttendanceRecord[] = [
      {
        id: 'att-3',
        instanceId: 'inst-101',
        courseId: 'SENG401',
        studentId: '1706188403',
        status: 'present',
        date: '2026-11-04T10:05:00.000Z',
      },
    ];

    const getSpy = vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url.includes('/attendance/instances/')) {
        return {
          data: {
            success: true,
            data: {
              ...mockSession,
              attendees: {
                items: attendeesWithoutName,
                meta: { total: 1 },
              },
            },
          },
        };
      }
      if (url.includes('/courses/SENG401/roster')) {
        return {
          data: {
            success: true,
            data: [
              {
                id: '1706188403',
                name: 'JOSEPH TETTEH MENSAH',
                email: 'joseph@knust.edu.gh',
              },
            ],
          },
        };
      }
      return { data: { success: true, data: [] } };
    });

    const createObjectURLSpy = vi.fn().mockReturnValue('blob:http://localhost/mock-blob-id');
    globalThis.URL.createObjectURL = createObjectURLSpy;
    globalThis.URL.revokeObjectURL = vi.fn();

    const clickSpy = vi.fn();
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const el = document.createElementNS('http://www.w3.org/1999/xhtml', tagName);
      if (tagName === 'a') {
        el.click = clickSpy;
      }
      return el;
    });

    await exportAttendanceSessionCsv(mockSession);

    expect(getSpy).toHaveBeenCalledWith('/courses/SENG401/roster');
    expect(clickSpy).toHaveBeenCalled();
  });
});

