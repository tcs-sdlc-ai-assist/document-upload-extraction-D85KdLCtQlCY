import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_audit_logs_user_id')
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string;

  @Index('idx_audit_logs_event_type')
  @Column({ name: 'event_type', type: 'varchar', length: 128 })
  eventType: string;

  @Column({ type: 'jsonb', nullable: true })
  details: Record<string, unknown>;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress: string;

  @CreateDateColumn({ name: 'timestamp' })
  timestamp: Date;
}