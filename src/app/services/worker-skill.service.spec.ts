import { TestBed } from '@angular/core/testing';

import { WorkerSkillService } from './worker-skill.service';

describe('WorkerSkillService', () => {
  let service: WorkerSkillService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WorkerSkillService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
