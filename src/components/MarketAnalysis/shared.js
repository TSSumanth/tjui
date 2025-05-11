export const expectationOptions = [
    'Upwards(Constant Rise)',
    'Downwards(Constant fall)',
    'Sideways(Neutral)',
    'Volatile(Neutral)',
    'Upwards(Volatile)',
    'Downwards(Volatile)'
];

export const initialForm = {
    date: new Date().toISOString().slice(0, 10),
    eventday: '0',
    eventdescription: '',
    premarketexpectation: '',
    premarketanalysis: '',
    postmarketanalysis: '',
    marketmovement: ''
};

export const quillModules = {
    toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'align': [] }],
        ['clean']
    ]
};