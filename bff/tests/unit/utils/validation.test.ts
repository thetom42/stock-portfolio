import 'mocha';
import { expect } from 'chai';
import { validateUUID } from '../../../src/utils/validation';

describe('Validation Utils', () => {
  describe('validateUUID', () => {
    it('should validate correct UUID v4', () => {
      const validUUIDs = [
        '123e4567-e89b-42d3-a456-426614174000',
        'c73bcdcc-2669-4bf6-81d3-e4ae73fb11fd',
        '507f191e-a1ae-4b08-8231-23a7c8637abd'
      ];

      validUUIDs.forEach(uuid => {
        expect(validateUUID(uuid)).to.be.true;
      });
    });

    it('should reject invalid UUIDs', () => {
      const invalidUUIDs = [
        '',                                     // empty string
        'not-a-uuid',                          // invalid format
        '123e4567-e89b-12d3-a456',            // too short
        '123e4567-e89b-12d3-a456-42661417400g', // invalid character
        '123e4567-e89b-12d3-a456-4266141740000' // too long
      ];

      invalidUUIDs.forEach(uuid => {
        expect(validateUUID(uuid)).to.be.false;
      });
    });

    it('should reject UUIDs with incorrect version (not v4)', () => {
      const nonV4UUIDs = [
        '123e4567-e89b-12d3-a456-426614174000', // v1
        '123e4567-e89b-22d3-a456-426614174000', // v2
        '123e4567-e89b-32d3-a456-426614174000', // v3
        '123e4567-e89b-52d3-a456-426614174000', // v5
      ];

      nonV4UUIDs.forEach(uuid => {
        expect(validateUUID(uuid)).to.be.false;
      });
    });

    it('should reject UUIDs with incorrect variant', () => {
      const incorrectVariantUUIDs = [
        '123e4567-e89b-42d3-0456-426614174000', // incorrect variant (0)
        '123e4567-e89b-42d3-c456-426614174000', // incorrect variant (c)
        '123e4567-e89b-42d3-d456-426614174000', // incorrect variant (d)
        '123e4567-e89b-42d3-e456-426614174000', // incorrect variant (e)
        '123e4567-e89b-42d3-f456-426614174000'  // incorrect variant (f)
      ];

      incorrectVariantUUIDs.forEach(uuid => {
        expect(validateUUID(uuid)).to.be.false;
      });
    });

    it('should handle case insensitivity correctly', () => {
      const uuid = '123E4567-E89B-42D3-A456-426614174000';
      expect(validateUUID(uuid)).to.be.true;
    });
  });
});
