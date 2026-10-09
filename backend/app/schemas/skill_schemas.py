from marshmallow import Schema, fields, validate

class SkillSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    category = fields.Str(required=True, validate=validate.Length(min=1, max=50))
    level = fields.Int(dump_only=True)
    progress = fields.Float(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

class SkillUpdateSchema(Schema):
    name = fields.Str(validate=validate.Length(min=1, max=100))
    category = fields.Str(validate=validate.Length(min=1, max=50))
    progress = fields.Float()
