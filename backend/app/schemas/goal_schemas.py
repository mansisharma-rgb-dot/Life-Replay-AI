from marshmallow import Schema, fields, validate, EXCLUDE

class GoalSchema(Schema):
    title = fields.String(required=True, validate=validate.Length(min=1, max=255))
    progress = fields.Float(validate=validate.Range(min=0), load_default=0.0)
    target = fields.Float(validate=validate.Range(min=0.1), load_default=100.0)
    category = fields.String(validate=validate.Length(max=50), allow_none=True)
    deadline = fields.Date(allow_none=True)
    status = fields.String(validate=validate.OneOf(['active', 'completed', 'archived']), load_default='active')

    class Meta:
        unknown = EXCLUDE

class GoalUpdateSchema(Schema):
    title = fields.String(validate=validate.Length(min=1, max=255))
    progress = fields.Float(validate=validate.Range(min=0))
    target = fields.Float(validate=validate.Range(min=0.1))
    category = fields.String(validate=validate.Length(max=50), allow_none=True)
    deadline = fields.Date(allow_none=True)
    status = fields.String(validate=validate.OneOf(['active', 'completed', 'archived']))

    class Meta:
        unknown = EXCLUDE
