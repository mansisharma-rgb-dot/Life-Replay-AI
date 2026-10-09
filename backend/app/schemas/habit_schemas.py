from marshmallow import Schema, fields, validate, EXCLUDE

class HabitSchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=1, max=100))
    icon = fields.String(validate=validate.Length(max=50), load_default='✨')
    frequency = fields.String(validate=validate.Length(max=50), load_default='daily')
    status = fields.String(validate=validate.OneOf(['active', 'archived']), load_default='active')

    class Meta:
        unknown = EXCLUDE

class HabitUpdateSchema(Schema):
    name = fields.String(validate=validate.Length(min=1, max=100))
    icon = fields.String(validate=validate.Length(max=50))
    frequency = fields.String(validate=validate.Length(max=50))
    status = fields.String(validate=validate.OneOf(['active', 'archived']))

    class Meta:
        unknown = EXCLUDE
