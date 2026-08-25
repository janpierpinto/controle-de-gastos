-- Required by Spring Modulith's JPA-backed event publication registry
-- (spring-modulith-starter-jpa), used to track delivery of Spring
-- Application Events published across module boundaries (see
-- docs/adr/0002-outbox-vs-rabbitmq.md for how this relates to the
-- Open Finance webhook outbox). Schema captured verbatim from what
-- Hibernate itself generates for org.springframework.modulith.events.jpa
-- .updating.DefaultJpaEventPublication (Spring Modulith 2.1.0), since
-- ddl-auto=validate requires an exact match and Modulith ships no SQL
-- migration of its own.

create table event_publication (
    completion_attempts     integer not null,
    completion_date         timestamptz,
    last_resubmission_date  timestamptz,
    publication_date        timestamptz not null,
    id                      uuid primary key,
    event_type              varchar(255) not null,
    listener_id             varchar(255) not null,
    serialized_event        varchar(255) not null,
    status                  varchar(255)
        check (status in ('PUBLISHED', 'PROCESSING', 'COMPLETED', 'FAILED', 'RESUBMITTED'))
);
