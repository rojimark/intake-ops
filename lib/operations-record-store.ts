import { OperationsRecord } from "@/lib/schema";

const globalForOperationsRecords = globalThis as unknown as {
  operationsRecords?: OperationsRecord[];
};

const records = globalForOperationsRecords.operationsRecords ?? [];

if (!globalForOperationsRecords.operationsRecords) {
  globalForOperationsRecords.operationsRecords = records;
}

export function addOperationsRecord(record: OperationsRecord) {
  const existingRecord = getOperationsRecordByEventId(record.eventId);
  if (existingRecord) {
    return existingRecord;
  }
  records.unshift(record);
  return record;
}

export function getOperationsRecords() {
  return records;
}

export function getOperationsRecordByEventId(eventId: string) {
  return records.find((record) => record.eventId === eventId) ?? null;
}