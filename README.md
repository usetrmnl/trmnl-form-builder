# trmnl-form-builder
A Javascript component for building [custom plugin form fields](https://help.trmnl.com/en/articles/10513740-custom-plugin-form-builder) for [TRMNL](https://trmnl.com/).

**Use it now on [Github Pages](https://usetrmnl.github.io/trmnl-form-builder/).**

## Usage
See `index.html` for an example.
```
<!-- The Web Component -->
<trmnl-form-builder accent-color="#F8654B" theme="light"></trmnl-form-builder>

<!-- Load the Web Component -->
<script src="trmnl-form-builder.js"></script>
```

Theme can also be set to `dark`.

Select fields support **Indexed in recipe search** (`indexable: true`). Only one
select can be indexed: checking another clears the previous selection. YAML import
and `setFields()` keep the first indexed select when several are marked, matching
core's YAML order. Duplicated fields start with indexing disabled. Recipe search
indexes the selected field's option labels, not their values.

### Known Issues
- Import
  - More complex YAML structures with `|` or `>` aren't parsed properly
